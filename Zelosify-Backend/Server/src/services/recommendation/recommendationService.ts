/**
 * Recommendation lifecycle service.
 * Manages atomic profile evaluation, LangGraph agent orchestration,
 * transaction-based persistence, and structured observability logging.
 */

import { PrismaClient, RecommendationStatus } from "@prisma/client";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import defaultPrisma from "../../config/prisma/prisma.js";
import { StorageService } from "../storage/storageService.js";
import { createStorageService } from "../storage/storageFactory.js";
import { createChatModel } from "./modelFactory.js";
import { buildRecommendationAgentGraph } from "./agentGraph.js";
import { logRecommendationEvent } from "./recommendationLogger.js";

export interface ProcessRecommendationOptions {
  model?: BaseChatModel;
  storageService?: StorageService;
  prisma?: PrismaClient;
  modelName?: string;
}

export interface RecommendationResult {
  profileId: number;
  openingId: string;
  recommended: boolean;
  score: number;
  confidence: number;
  reason: string;
  decision: string;
  status: RecommendationStatus;
  latencyMs: number;
  version: string;
}

const RECOMMENDATION_VERSION = "v1.0.0";

/**
 * Executes end-to-end candidate recommendation evaluation.
 */
export async function processRecommendation(
  profileId: number,
  options: ProcessRecommendationOptions = {}
): Promise<RecommendationResult> {
  const prisma = options.prisma || defaultPrisma;
  const storageService = options.storageService || createStorageService();
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();

  let parsingLatencyMs = 0;
  let matchingLatencyMs = 0;

  // 1. Fetch profile and opening context
  const profile = await prisma.hiringProfile.findUnique({
    where: { id: profileId },
    include: { opening: true },
  });

  if (!profile) {
    throw new Error(`Profile with ID ${profileId} not found.`);
  }

  if (profile.isDeleted) {
    throw new Error(`Profile with ID ${profileId} is deleted and cannot be evaluated.`);
  }

  const opening = profile.opening;
  if (!opening) {
    throw new Error(`Opening associated with profile ${profileId} not found.`);
  }

  // 2. Set recommendationStatus = PROCESSING
  await prisma.hiringProfile.update({
    where: { id: profileId },
    data: {
      recommendationStatus: RecommendationStatus.PROCESSING,
    },
  });

  // Resolve model
  let model: BaseChatModel;
  let modelName = options.modelName || "unknown-model";
  try {
    if (options.model) {
      model = options.model;
      modelName = (model as any).name || (model as any)._llmType?.() || "custom-model";
    } else {
      model = createChatModel();
      modelName = (model as any).model || "langchain-chat-model";
    }
  } catch (err: any) {
    // If model initialization fails (e.g. missing API keys in test environment)
    await prisma.hiringProfile.update({
      where: { id: profileId },
      data: {
        recommendationStatus: RecommendationStatus.FAILED,
      },
    });

    const totalLatencyMs = Date.now() - startTime;
    logRecommendationEvent({
      event: "recommendation.failed",
      profileId,
      openingId: opening.id,
      startTime: startTimeIso,
      totalLatencyMs,
      model: modelName,
      retryCount: 0,
      error: err.message,
    });

    throw err;
  }

  // 3. Build and execute LangGraph agent
  let agentResult: any;
  try {
    const agentGraph = buildRecommendationAgentGraph({
      model,
      toolContext: {
        storageService,
        prisma,
        onParsingComplete: (lat) => {
          parsingLatencyMs = lat;
        },
        onMatchingComplete: (lat) => {
          matchingLatencyMs = lat;
        },
      },
    });

    // Parse required skills from Opening JSON
    let requiredSkillsArray: string[] = [];
    if (Array.isArray(opening.requiredSkills)) {
      requiredSkillsArray = opening.requiredSkills as string[];
    } else if (typeof opening.requiredSkills === "string") {
      try {
        const parsed = JSON.parse(opening.requiredSkills);
        requiredSkillsArray = Array.isArray(parsed) ? parsed : [opening.requiredSkills];
      } catch {
        requiredSkillsArray = [opening.requiredSkills];
      }
    }

    agentResult = await agentGraph.invoke({
      profileId,
      openingId: opening.id,
      openingContext: {
        title: opening.title,
        description: opening.description,
        experienceMin: opening.experienceMin,
        experienceMax: opening.experienceMax,
        requiredSkills: requiredSkillsArray,
        location: opening.location,
      },
      messages: [],
    });
  } catch (err: any) {
    // Mark FAILED and preserve existing profile submission fields
    await prisma.hiringProfile.update({
      where: { id: profileId },
      data: {
        recommendationStatus: RecommendationStatus.FAILED,
      },
    });

    const totalLatencyMs = Date.now() - startTime;
    logRecommendationEvent({
      event: "recommendation.failed",
      profileId,
      openingId: opening.id,
      startTime: startTimeIso,
      parsingLatencyMs,
      matchingLatencyMs,
      totalLatencyMs,
      model: modelName,
      retryCount: 0,
      error: err.message,
    });

    throw err;
  }

  const totalLatencyMs = Date.now() - startTime;

  // 4. Validate agent outputs
  if (
    agentResult.status !== "COMPLETED" ||
    !agentResult.decision ||
    !agentResult.scoringResult ||
    !agentResult.llmOutput
  ) {
    // Evaluation failed validation after retries
    await prisma.hiringProfile.update({
      where: { id: profileId },
      data: {
        recommendationStatus: RecommendationStatus.FAILED,
      },
    });

    const errorMessage =
      agentResult.error || "Agent execution failed validation or incomplete output.";

    logRecommendationEvent({
      event: "recommendation.failed",
      profileId,
      openingId: opening.id,
      startTime: startTimeIso,
      parsingLatencyMs,
      matchingLatencyMs,
      totalLatencyMs,
      finalScore: agentResult.scoringResult?.finalScore,
      model: modelName,
      retryCount: agentResult.retryCount || 0,
      error: errorMessage,
    });

    return {
      profileId,
      openingId: opening.id,
      recommended: false,
      score: agentResult.scoringResult?.finalScore ?? 0,
      confidence: 0,
      reason: errorMessage,
      decision: "Failed",
      status: RecommendationStatus.FAILED,
      latencyMs: totalLatencyMs,
      version: RECOMMENDATION_VERSION,
    };
  }

  // 5. Persist recommendation atomically inside a Prisma transaction
  const updatedProfile = await (prisma as any).$transaction(async (tx: any) => {
    return await tx.hiringProfile.update({
      where: { id: profileId },
      data: {
        recommended: agentResult.decision.isRecommended,
        recommendationScore: agentResult.scoringResult.finalScore,
        recommendationReason: agentResult.llmOutput.reason,
        recommendationLatencyMs: totalLatencyMs,
        recommendationVersion: RECOMMENDATION_VERSION,
        recommendationConfidence: agentResult.llmOutput.confidence,
        recommendedAt: new Date(),
        recommendationStatus: RecommendationStatus.COMPLETED,
      },
    });
  });

  // 6. Observability structured JSON logging
  logRecommendationEvent({
    event: "recommendation.completed",
    profileId,
    openingId: opening.id,
    startTime: startTimeIso,
    parsingLatencyMs,
    matchingLatencyMs,
    totalLatencyMs,
    finalScore: agentResult.scoringResult.finalScore,
    model: modelName,
    retryCount: agentResult.retryCount || 0,
  });

  return {
    profileId: updatedProfile.id,
    openingId: updatedProfile.openingId,
    recommended: updatedProfile.recommended ?? false,
    score: updatedProfile.recommendationScore ?? 0,
    confidence: updatedProfile.recommendationConfidence ?? 0,
    reason: updatedProfile.recommendationReason ?? "",
    decision: agentResult.decision.decision,
    status: updatedProfile.recommendationStatus,
    latencyMs: totalLatencyMs,
    version: RECOMMENDATION_VERSION,
  };
}

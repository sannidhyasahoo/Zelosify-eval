/**
 * Callable LangChain agent tools for recommendation evaluation.
 * Exposes deterministic business logic and storage abstractions to the LLM.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { StorageService } from "../storage/storageService.js";
import { extractTextFromBuffer, extractStructuredResume, StructuredResume } from "./resumeParser.js";
import { normalizeSkills } from "./skillNormalization.js";
import { calculateMatchScore, MatchScoreResult } from "./scoringService.js";

export interface ToolContext {
  storageService: StorageService;
  prisma: PrismaClient;
  onParsingComplete?: (latencyMs: number) => void;
  onMatchingComplete?: (latencyMs: number, result: MatchScoreResult) => void;
}

export function createRecommendationTools(ctx: ToolContext) {
  /**
   * Tool 1: parse_resume
   * Fetches profile from DB, downloads file from S3, parses text, and returns structured resume.
   */
  const parseResumeTool = tool(
    async ({ profileId }: { profileId: number }) => {
      const startTime = Date.now();

      const profile = await ctx.prisma.hiringProfile.findUnique({
        where: { id: profileId },
        include: { opening: true },
      });

      if (!profile) {
        throw new Error(`Profile with ID ${profileId} not found.`);
      }

      if (profile.isDeleted) {
        throw new Error(`Profile with ID ${profileId} has been deleted.`);
      }

      // Download file stream from S3 storage
      const stream = await ctx.storageService.getObjectStream(profile.s3Key);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      // Extract raw text
      const rawText = await extractTextFromBuffer(
        buffer,
        profile.originalFilename || profile.s3Key
      );

      // Extract structured resume
      const structuredResume: StructuredResume = extractStructuredResume(rawText);

      const parsingLatencyMs = Date.now() - startTime;
      if (ctx.onParsingComplete) {
        ctx.onParsingComplete(parsingLatencyMs);
      }

      return structuredResume;
    },
    {
      name: "parse_resume",
      description:
        "Fetches and parses a candidate's resume by profileId from secure storage, returning structured candidate information.",
      schema: z.object({
        profileId: z.number().describe("The ID of the candidate profile to parse"),
      }),
    }
  );

  /**
   * Tool 2: extract_features
   * Extracts candidate experience, skills, and location from structured resume and opening context.
   */
  const extractFeaturesTool = tool(
    async ({
      structuredResume,
      openingRequirements,
    }: {
      structuredResume: {
        experienceYears: number;
        skills: string[];
        location: string;
      };
      openingRequirements?: {
        experienceMin?: number;
        experienceMax?: number | null;
        requiredSkills?: string[];
        location?: string | null;
      };
    }) => {
      return {
        experienceYears: Number(structuredResume.experienceYears) || 0,
        skills: Array.isArray(structuredResume.skills) ? structuredResume.skills : [],
        location: String(structuredResume.location || ""),
      };
    },
    {
      name: "extract_features",
      description:
        "Extracts normalized evaluation features (experienceYears, skills, location) from the structured resume.",
      schema: z.object({
        structuredResume: z.object({
          experienceYears: z.number().describe("Years of experience"),
          skills: z.array(z.string()).describe("List of candidate skills"),
          location: z.string().describe("Candidate location"),
        }),
        openingRequirements: z
          .object({
            experienceMin: z.number().optional(),
            experienceMax: z.number().nullable().optional(),
            requiredSkills: z.array(z.string()).optional(),
            location: z.string().nullable().optional(),
          })
          .optional()
          .describe("Target opening requirements"),
      }),
    }
  );

  /**
   * Tool 3: normalize_skills
   * Normalizes a list of candidate skills using the deterministic alias dictionary.
   */
  const normalizeSkillsTool = tool(
    async ({ skills }: { skills: string[] }) => {
      const normalized = normalizeSkills(skills);
      return { normalizedSkills: normalized };
    },
    {
      name: "normalize_skills",
      description:
        "Normalizes technical skill names using deterministic canonical aliases (e.g. React.js -> react, Node -> nodejs).",
      schema: z.object({
        skills: z.array(z.string()).describe("List of candidate skill strings"),
      }),
    }
  );

  /**
   * Tool 4: calculate_match_score
   * Calculates deterministic experience, skill, and location match scores.
   * The LLM must NEVER compute these numeric scores itself.
   */
  const calculateMatchScoreTool = tool(
    async ({
      candidateExperience,
      minExperience,
      maxExperience,
      candidateSkills,
      requiredSkills,
      candidateLocation,
      openingLocation,
    }: {
      candidateExperience: number;
      minExperience: number;
      maxExperience?: number | null;
      candidateSkills: string[];
      requiredSkills: string[];
      candidateLocation: string;
      openingLocation?: string | null;
    }) => {
      const startTime = Date.now();

      const result = calculateMatchScore({
        candidateExp: candidateExperience,
        minExp: minExperience,
        maxExp: maxExperience,
        candidateSkills,
        requiredSkills,
        candidateLocation,
        openingLocation,
      });

      const matchingLatencyMs = Date.now() - startTime;
      if (ctx.onMatchingComplete) {
        ctx.onMatchingComplete(matchingLatencyMs, result);
      }

      return result;
    },
    {
      name: "calculate_match_score",
      description:
        "Calculates deterministic match scores (experience, skills, location, and final score) using defined evaluation rules.",
      schema: z.object({
        candidateExperience: z.number().describe("Candidate years of experience"),
        minExperience: z.number().describe("Minimum required experience from the opening"),
        maxExperience: z
          .number()
          .nullable()
          .optional()
          .describe("Maximum required experience from the opening"),
        candidateSkills: z.array(z.string()).describe("Candidate skills"),
        requiredSkills: z
          .array(z.string())
          .describe("Required skills from the opening"),
        candidateLocation: z.string().describe("Candidate location"),
        openingLocation: z
          .string()
          .nullable()
          .optional()
          .describe("Opening location"),
      }),
    }
  );

  return {
    parseResumeTool,
    extractFeaturesTool,
    normalizeSkillsTool,
    calculateMatchScoreTool,
    allTools: [
      parseResumeTool,
      extractFeaturesTool,
      normalizeSkillsTool,
      calculateMatchScoreTool,
    ],
  };
}

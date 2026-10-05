/**
 * Structured observability logger for recommendation execution.
 * Dumps only clean structured JSON with performance and error metrics.
 * NEVER logs raw resume text or private chain-of-thought.
 */

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface RecommendationLogPayload {
  event: string;
  profileId: number;
  openingId: string;
  startTime: string;
  parsingLatencyMs?: number;
  matchingLatencyMs?: number;
  totalLatencyMs: number;
  finalScore?: number;
  model: string;
  tokenUsage?: TokenUsage;
  retryCount: number;
  error?: string;
}

export function logRecommendationEvent(payload: RecommendationLogPayload): void {
  // Output single-line structured JSON log
  console.log(JSON.stringify(payload));
}

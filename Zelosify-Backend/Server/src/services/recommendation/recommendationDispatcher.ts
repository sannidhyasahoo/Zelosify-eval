/**
 * In-process recommendation dispatcher and concurrency limiter.
 * Automatically schedules and processes recommendation evaluations without blocking
 * the HTTP submission cycle. Concurrency is bounded to prevent unbounded LLM invocations.
 */

import { processRecommendation } from "./recommendationService.js";

export class RecommendationDispatcher {
  private queue: number[] = [];
  private inFlight = 0;
  private readonly maxConcurrency: number;
  private idleResolvers: (() => void)[] = [];

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Enqueues one or more profile IDs for asynchronous recommendation processing.
   * Immediately returns without awaiting LLM execution.
   */
  dispatch(profileIds: number | number[]): void {
    const ids = Array.isArray(profileIds) ? profileIds : [profileIds];
    for (const id of ids) {
      if (typeof id === "number" && !isNaN(id)) {
        this.queue.push(id);
      }
    }

    console.log(
      `[RecommendationDispatcher] Enqueued ${ids.length} profiles. Queue size: ${this.queue.length}, in-flight: ${this.inFlight}`
    );

    // Trigger queue processing asynchronously
    this.processNext();
  }

  /**
   * Internal queue runner respecting concurrency limits.
   */
  private processNext(): void {
    while (this.inFlight < this.maxConcurrency && this.queue.length > 0) {
      const profileId = this.queue.shift();
      if (profileId === undefined) break;

      this.inFlight++;

      // Self-contained execution catching all errors to protect the server
      (async () => {
        try {
          console.log(`[RecommendationDispatcher] Starting recommendation for profile #${profileId}`);
          await processRecommendation(profileId);
          console.log(`[RecommendationDispatcher] Completed recommendation for profile #${profileId}`);
        } catch (error: any) {
          // Unhandled rejection will never crash Express
          console.error(
            `[RecommendationDispatcher] Error processing recommendation for profile #${profileId}:`,
            error?.message || error
          );
        } finally {
          this.inFlight--;
          this.processNext();
          this.checkIdle();
        }
      })();
    }

    this.checkIdle();
  }

  private checkIdle(): void {
    if (this.inFlight === 0 && this.queue.length === 0 && this.idleResolvers.length > 0) {
      const resolvers = [...this.idleResolvers];
      this.idleResolvers = [];
      resolvers.forEach((resolve) => resolve());
    }
  }

  /**
   * Returns a promise that resolves when all queued and in-flight tasks have finished.
   * Useful for unit and integration testing.
   */
  waitForIdle(): Promise<void> {
    if (this.inFlight === 0 && this.queue.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.idleResolvers.push(resolve);
    });
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getInFlightCount(): number {
    return this.inFlight;
  }

  getMaxConcurrency(): number {
    return this.maxConcurrency;
  }
}

// Global singleton instance with default concurrency of 3
export const recommendationDispatcher = new RecommendationDispatcher(3);

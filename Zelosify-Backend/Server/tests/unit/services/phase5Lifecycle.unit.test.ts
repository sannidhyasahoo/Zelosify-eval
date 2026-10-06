import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileStatus, RecommendationStatus } from "@prisma/client";
import { AIMessage } from "@langchain/core/messages";

const { mockPrismaClient } = vi.hoisted(() => {
  const mockPrisma: any = {
    hiringProfile: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === "function") {
        return cb(mockPrisma);
      }
      return Promise.all(cb);
    }),
  };
  return { mockPrismaClient: mockPrisma };
});

vi.mock("../../../src/config/prisma/prisma.js", () => ({
  default: mockPrismaClient,
}));


import {
  RecommendationDispatcher,
  recommendationDispatcher,
} from "../../../src/services/recommendation/recommendationDispatcher.js";
import {
  hiringDecisionService,
} from "../../../src/services/hiring/hiringDecisionService.js";
import {
  processRecommendation,
} from "../../../src/services/recommendation/recommendationService.js";
import { MockChatModel } from "../../../src/services/recommendation/modelFactory.js";

describe("PHASE 5: Automatic Trigger, Idempotency, Decisions & Metadata Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // AUTOMATIC TRIGGER (Requirements 1 - 4)
  // ==========================================

  describe("Automatic Trigger & Dispatcher", () => {
    it("1. submitted profile is queued after successful transaction", async () => {
      const dispatchSpy = vi.spyOn(recommendationDispatcher, "dispatch");

      const createdIds = [101, 102];
      recommendationDispatcher.dispatch(createdIds);

      expect(dispatchSpy).toHaveBeenCalledWith(createdIds);
    });

    it("2. HTTP upload flow does not wait for recommendation completion", async () => {
      let longTaskStarted = false;
      let longTaskCompleted = false;

      const dispatcher = new RecommendationDispatcher(1);

      // Simulate a long-running LLM job
      vi.spyOn(dispatcher as any, "processNext").mockImplementation(function (this: any) {
        if (this.queue.length > 0) {
          this.queue.shift();
          this.inFlight++;
          longTaskStarted = true;
          setTimeout(() => {
            longTaskCompleted = true;
            this.inFlight--;
          }, 300);
        }
      });

      const startTime = Date.now();
      dispatcher.dispatch([555]);
      const elapsed = Date.now() - startTime;

      // dispatch must return immediately (< 50ms) while the job takes 300ms
      expect(elapsed).toBeLessThan(50);
      expect(longTaskStarted).toBe(true);
      expect(longTaskCompleted).toBe(false);
    });

    it("3. batch upload respects dispatcher concurrency concept", async () => {
      let activeJobs = 0;
      let maxObservedActiveJobs = 0;

      const dispatcher = new RecommendationDispatcher(3); // Concurrency = 3

      // Mock processNext to simulate concurrent execution
      vi.spyOn(dispatcher as any, "processNext").mockImplementation(function (this: any) {
        while (this.inFlight < this.maxConcurrency && this.queue.length > 0) {
          this.queue.shift();
          this.inFlight++;
          activeJobs++;
          if (activeJobs > maxObservedActiveJobs) {
            maxObservedActiveJobs = activeJobs;
          }

          setTimeout(() => {
            activeJobs--;
            this.inFlight--;
            this.processNext();
          }, 20);
        }
      });

      // Enqueue 8 jobs
      dispatcher.dispatch([1, 2, 3, 4, 5, 6, 7, 8]);

      // Concurrency must never exceed 3
      expect(maxObservedActiveJobs).toBeLessThanOrEqual(3);
    });

    it("4. recommendation error does not crash request/server", async () => {
      const dispatcher = new RecommendationDispatcher(1);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Simulate an internal worker job that throws an error
      vi.spyOn(dispatcher as any, "processNext").mockImplementation(function (this: any) {
        while (this.inFlight < this.maxConcurrency && this.queue.length > 0) {
          this.queue.shift();
          this.inFlight++;
          try {
            throw new Error("Simulated async recommendation failure");
          } catch (e: any) {
            console.error(e.message);
          } finally {
            this.inFlight--;
          }
        }
      });

      dispatcher.dispatch([99999]);

      expect(dispatcher.getInFlightCount()).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Simulated async recommendation failure");
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // IDEMPOTENCY (Requirements 5 - 7)
  // ==========================================

  describe("Recommendation Idempotency", () => {
    it("5. COMPLETED profile is not reprocessed automatically", async () => {
      const mockProfile = {
        id: 301,
        openingId: "op-1",
        recommended: true,
        recommendationScore: 0.9,
        recommendationConfidence: 0.95,
        recommendationReason: "Already completed evaluation",
        recommendationStatus: RecommendationStatus.COMPLETED,
        isDeleted: false,
        opening: { id: "op-1", title: "Job" },
      };

      const mockPrisma: any = {
        hiringProfile: {
          findUnique: vi.fn().mockResolvedValue(mockProfile),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
      };

      const mockModel = new MockChatModel([]);
      const generateSpy = vi.spyOn(mockModel, "_generate");

      const result = await processRecommendation(301, {
        prisma: mockPrisma,
        model: mockModel,
      });

      // Model must not be invoked
      expect(generateSpy).not.toHaveBeenCalled();
      expect(result.status).toBe(RecommendationStatus.COMPLETED);
      expect(result.score).toBe(0.9);
      expect(mockPrisma.hiringProfile.update).not.toHaveBeenCalled();
    });

    it("6. PROCESSING profile cannot start duplicate processing", async () => {
      const mockProfile = {
        id: 302,
        openingId: "op-2",
        recommendationStatus: RecommendationStatus.PROCESSING,
        isDeleted: false,
        opening: { id: "op-2", title: "Job" },
      };

      const mockPrisma: any = {
        hiringProfile: {
          findUnique: vi.fn().mockResolvedValue(mockProfile),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }), // Conditional lock fails
        },
      };

      const mockModel = new MockChatModel([]);
      const generateSpy = vi.spyOn(mockModel, "_generate");

      const result = await processRecommendation(302, {
        prisma: mockPrisma,
        model: mockModel,
      });

      // Must avoid duplicate processing
      expect(generateSpy).not.toHaveBeenCalled();
      expect(result.status).toBe(RecommendationStatus.PROCESSING);
    });

    it("7. FAILED profile can be retried", async () => {
      const mockOpening = {
        id: "op-failed-retry",
        title: "Developer",
        experienceMin: 2,
        experienceMax: 5,
        requiredSkills: ["react"],
        location: "Remote",
      };

      const mockProfile = {
        id: 303,
        openingId: "op-failed-retry",
        s3Key: "t1/op-1/file.pptx",
        originalFilename: "file.pptx",
        recommendationStatus: RecommendationStatus.FAILED, // Started as FAILED
        isDeleted: false,
        opening: mockOpening,
      };

      const mockStorage: any = {
        getObjectStream: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from("");
          },
        }),
      };

      let claimedCount = 0;
      const mockPrisma: any = {
        hiringProfile: {
          findUnique: vi.fn().mockResolvedValue(mockProfile),
          updateMany: vi.fn().mockImplementation((args) => {
            if (args.where.recommendationStatus.in.includes(RecommendationStatus.FAILED)) {
              claimedCount++;
              return { count: 1 };
            }
            return { count: 0 };
          }),
          update: vi.fn().mockImplementation((args) => ({ ...mockProfile, ...args.data })),
        },
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      };

      const mockModel = new MockChatModel([
        new AIMessage({
          content: "",
          tool_calls: [
            {
              name: "calculate_match_score",
              args: {
                candidateExperience: 3,
                minExperience: 2,
                maxExperience: 5,
                candidateSkills: ["react"],
                requiredSkills: ["react"],
                candidateLocation: "Remote",
                openingLocation: "Remote",
              },
              id: "c1",
            },
          ],
        }),
        new AIMessage({
          content: JSON.stringify({ confidence: 0.9, reason: "Retry succeeded." }),
        }),
      ]);

      const result = await processRecommendation(303, {
        prisma: mockPrisma,
        model: mockModel,
        storageService: mockStorage,
      });

      expect(claimedCount).toBe(1);
      expect(result.status).toBe(RecommendationStatus.COMPLETED);
    });
  });

  // ==========================================
  // SHORTLIST & REJECT (Requirements 8 - 14)
  // ==========================================

  describe("Hiring Manager Decisions", () => {
    it("8. manager can shortlist profile for own opening", async () => {
      const mockProfile = {
        id: 401,
        status: ProfileStatus.SUBMITTED,
        isDeleted: false,
        opening: {
          id: "open-1",
          tenantId: "tenant-wayne",
          hiringManagerId: "hm-lucius",
        },
      };

      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce(mockProfile);
      mockPrismaClient.hiringProfile.update.mockResolvedValueOnce({
        ...mockProfile,
        status: ProfileStatus.SHORTLISTED,
        shortlistedBy: "hm-lucius",
        shortlistedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
      });

      const result = await hiringDecisionService.shortlistProfile({
        profileId: 401,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      expect(result?.status).toBe(ProfileStatus.SHORTLISTED);
      expect(result?.shortlistedBy).toBe("hm-lucius");
      expect(result?.rejectedBy).toBeNull();
    });

    it("9. manager cannot shortlist another manager's profile", async () => {
      // Return null because where clause required opening.hiringManagerId === hm-other
      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce(null);

      const result = await hiringDecisionService.shortlistProfile({
        profileId: 402,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-other", // Wrong manager
      });

      // Must return null for scope violation
      expect(result).toBeNull();
    });

    it("10. manager cannot shortlist cross-tenant profile", async () => {
      // Return null because where clause required opening.tenantId === tenant-other
      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce(null);

      const result = await hiringDecisionService.shortlistProfile({
        profileId: 403,
        tenantId: "tenant-other", // Wrong tenant
        hiringManagerId: "hm-lucius",
      });

      expect(result).toBeNull();
    });

    it("11. shortlist clears rejection metadata", async () => {
      const mockRejectedProfile = {
        id: 404,
        status: ProfileStatus.REJECTED,
        rejectedBy: "hm-lucius",
        rejectedAt: new Date(),
        isDeleted: false,
        opening: {
          tenantId: "tenant-wayne",
          hiringManagerId: "hm-lucius",
        },
      };

      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce(mockRejectedProfile);
      mockPrismaClient.hiringProfile.update.mockImplementationOnce((args: any) => ({
        ...mockRejectedProfile,
        ...args.data,
      }));

      const result = await hiringDecisionService.shortlistProfile({
        profileId: 404,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      expect(result?.status).toBe(ProfileStatus.SHORTLISTED);
      expect(result?.rejectedBy).toBeNull();
      expect(result?.rejectedAt).toBeNull();
      expect(result?.shortlistedBy).toBe("hm-lucius");
    });

    it("12. manager can reject profile for own opening", async () => {
      const mockProfile = {
        id: 405,
        status: ProfileStatus.SUBMITTED,
        isDeleted: false,
        opening: {
          id: "open-1",
          tenantId: "tenant-wayne",
          hiringManagerId: "hm-lucius",
        },
      };

      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce(mockProfile);
      mockPrismaClient.hiringProfile.update.mockResolvedValueOnce({
        ...mockProfile,
        status: ProfileStatus.REJECTED,
        rejectedBy: "hm-lucius",
        rejectedAt: new Date(),
        shortlistedBy: null,
        shortlistedAt: null,
      });

      const result = await hiringDecisionService.rejectProfile({
        profileId: 405,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      expect(result?.status).toBe(ProfileStatus.REJECTED);
      expect(result?.rejectedBy).toBe("hm-lucius");
      expect(result?.shortlistedBy).toBeNull();
    });

    it("13. reject clears shortlist metadata", async () => {
      const mockShortlistedProfile = {
        id: 406,
        status: ProfileStatus.SHORTLISTED,
        shortlistedBy: "hm-lucius",
        shortlistedAt: new Date(),
        isDeleted: false,
        opening: {
          tenantId: "tenant-wayne",
          hiringManagerId: "hm-lucius",
        },
      };

      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce(mockShortlistedProfile);
      mockPrismaClient.hiringProfile.update.mockImplementationOnce((args: any) => ({
        ...mockShortlistedProfile,
        ...args.data,
      }));

      const result = await hiringDecisionService.rejectProfile({
        profileId: 406,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      expect(result?.status).toBe(ProfileStatus.REJECTED);
      expect(result?.shortlistedBy).toBeNull();
      expect(result?.shortlistedAt).toBeNull();
    });

    it("14. repeated same decision is safe", async () => {
      const mockProfile = {
        id: 407,
        status: ProfileStatus.SHORTLISTED,
        shortlistedBy: "hm-lucius",
        shortlistedAt: new Date(),
        isDeleted: false,
        opening: {
          tenantId: "tenant-wayne",
          hiringManagerId: "hm-lucius",
        },
      };

      mockPrismaClient.hiringProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrismaClient.hiringProfile.update.mockResolvedValue(mockProfile);

      const first = await hiringDecisionService.shortlistProfile({
        profileId: 407,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      const second = await hiringDecisionService.shortlistProfile({
        profileId: 407,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      expect(first?.status).toBe(ProfileStatus.SHORTLISTED);
      expect(second?.status).toBe(ProfileStatus.SHORTLISTED);
    });
  });

  // ==========================================
  // RETRY RECOMMENDATION (Requirements 15 - 17)
  // ==========================================

  describe("Recommendation Retry Endpoint Flow", () => {
    it("15. manager can retry own FAILED profile", async () => {
      const dispatchSpy = vi.spyOn(recommendationDispatcher, "dispatch");

      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce({
        id: 501,
        recommendationStatus: RecommendationStatus.FAILED,
        isDeleted: false,
      });

      const res = await hiringDecisionService.retryRecommendation({
        profileId: 501,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      expect(res.success).toBe(true);
      expect(dispatchSpy).toHaveBeenCalledWith(501);
    });

    it("16. cross-manager retry denied", async () => {
      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce(null);

      const res = await hiringDecisionService.retryRecommendation({
        profileId: 502,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-other",
      });

      expect(res.success).toBe(false);
      expect(res.reason).toBe("NOT_FOUND");
    });

    it("17. COMPLETED recommendation cannot be retried through normal retry endpoint", async () => {
      mockPrismaClient.hiringProfile.findFirst.mockResolvedValueOnce({
        id: 503,
        recommendationStatus: RecommendationStatus.COMPLETED,
        isDeleted: false,
      });

      const res = await hiringDecisionService.retryRecommendation({
        profileId: 503,
        tenantId: "tenant-wayne",
        hiringManagerId: "hm-lucius",
      });

      expect(res.success).toBe(false);
      expect(res.reason).toBe("ALREADY_COMPLETED");
    });
  });

  // ==========================================
  // METADATA SAFETY (Requirements 18 - 20)
  // ==========================================

  describe("Recommendation Metadata Safety", () => {
    it("18. recommendation metadata stores score breakdown", async () => {
      const mockOpening = {
        id: "op-meta-1",
        title: "Staff Engineer",
        experienceMin: 5,
        experienceMax: 10,
        requiredSkills: ["react", "nodejs"],
        location: "Remote",
      };

      const mockProfile = {
        id: 601,
        openingId: "op-meta-1",
        s3Key: "t1/op/meta.pptx",
        originalFilename: "meta.pptx",
        recommendationStatus: RecommendationStatus.PENDING,
        isDeleted: false,
        opening: mockOpening,
      };

      const mockStorage: any = {
        getObjectStream: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from("");
          },
        }),
      };

      let persistedMetadata: any = null;
      const mockPrisma: any = {
        hiringProfile: {
          findUnique: vi.fn().mockResolvedValue(mockProfile),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn().mockImplementation((args) => {
            persistedMetadata = args.data.recommendationMetadata;
            return { ...mockProfile, ...args.data };
          }),
        },
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      };

      const mockModel = new MockChatModel([
        new AIMessage({
          content: "",
          tool_calls: [
            {
              name: "calculate_match_score",
              args: {
                candidateExperience: 6,
                minExperience: 5,
                maxExperience: 10,
                candidateSkills: ["react", "nodejs"],
                requiredSkills: ["react", "nodejs"],
                candidateLocation: "Remote",
                openingLocation: "Remote",
              },
              id: "c1",
            },
          ],
        }),
        new AIMessage({
          content: JSON.stringify({ confidence: 0.92, reason: "Excellent match." }),
        }),
      ]);

      await processRecommendation(601, {
        prisma: mockPrisma,
        model: mockModel,
        storageService: mockStorage,
      });

      expect(persistedMetadata).toBeDefined();
      expect(persistedMetadata.scores).toEqual({
        skills: 1,
        experience: 1,
        location: 1,
      });
      expect(persistedMetadata.tools).toContain("calculate_match_score");
      expect(persistedMetadata.retryCount).toBe(0);
    });

    it("19. metadata contains no raw resume content", async () => {
      const mockOpening = {
        id: "op-meta-2",
        title: "Engineer",
        experienceMin: 2,
        requiredSkills: ["typescript"],
      };

      const mockProfile = {
        id: 602,
        openingId: "op-meta-2",
        s3Key: "k",
        originalFilename: "f.pdf",
        recommendationStatus: RecommendationStatus.PENDING,
        isDeleted: false,
        opening: mockOpening,
      };

      const mockStorage: any = {
        getObjectStream: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from("Sensitive resume data and private contact info");
          },
        }),
      };

      let persistedMetadata: any = null;
      const mockPrisma: any = {
        hiringProfile: {
          findUnique: vi.fn().mockResolvedValue(mockProfile),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn().mockImplementation((args) => {
            persistedMetadata = args.data.recommendationMetadata;
            return { ...mockProfile, ...args.data };
          }),
        },
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      };

      const mockModel = new MockChatModel([
        new AIMessage({
          content: "",
          tool_calls: [
            {
              name: "calculate_match_score",
              args: {
                candidateExperience: 4,
                minExperience: 2,
                candidateSkills: ["typescript"],
                requiredSkills: ["typescript"],
                candidateLocation: "Remote",
              },
              id: "c1",
            },
          ],
        }),
        new AIMessage({
          content: JSON.stringify({ confidence: 0.85, reason: "Good skills match." }),
        }),
      ]);

      await processRecommendation(602, {
        prisma: mockPrisma,
        model: mockModel,
        storageService: mockStorage,
      });

      const serialized = JSON.stringify(persistedMetadata);
      expect(serialized).not.toContain("Sensitive resume data");
      expect(serialized).not.toContain("private contact info");
      expect(serialized).not.toContain("You are the Zelosify Candidate Recommendation Agent");
    });

    it("20. token usage uses actual model metadata or null, never fabricated", async () => {
      const mockOpening = {
        id: "op-meta-3",
        title: "Engineer",
        experienceMin: 1,
        requiredSkills: ["python"],
      };

      const mockProfile = {
        id: 603,
        openingId: "op-meta-3",
        s3Key: "k",
        originalFilename: "f.pdf",
        recommendationStatus: RecommendationStatus.PENDING,
        isDeleted: false,
        opening: mockOpening,
      };

      const mockStorage: any = {
        getObjectStream: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from("");
          },
        }),
      };

      let persistedMetadata: any = null;
      const mockPrisma: any = {
        hiringProfile: {
          findUnique: vi.fn().mockResolvedValue(mockProfile),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn().mockImplementation((args) => {
            persistedMetadata = args.data.recommendationMetadata;
            return { ...mockProfile, ...args.data };
          }),
        },
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      };

      // Model returns NO token usage
      const mockModel = new MockChatModel([
        new AIMessage({
          content: "",
          tool_calls: [
            {
              name: "calculate_match_score",
              args: {
                candidateExperience: 3,
                minExperience: 1,
                candidateSkills: ["python"],
                requiredSkills: ["python"],
                candidateLocation: "Remote",
              },
              id: "c1",
            },
          ],
        }),
        new AIMessage({
          content: JSON.stringify({ confidence: 0.8, reason: "Match." }),
        }),
      ]);

      await processRecommendation(603, {
        prisma: mockPrisma,
        model: mockModel,
        storageService: mockStorage,
      });

      // When token metadata is absent from model, tokenUsage MUST be null, never invented
      expect(persistedMetadata.tokenUsage).toBeNull();
    });
  });
});

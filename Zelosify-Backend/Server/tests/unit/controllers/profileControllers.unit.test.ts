import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock profileLifecycleService
vi.mock("../../../src/services/opening/profileLifecycleService.js", () => ({
  profileLifecycleService: {
    generateCandidatePresignedUrls: vi.fn(),
    submitCandidateProfiles: vi.fn(),
    softDeleteVendorProfile: vi.fn(),
    getProfilePreview: vi.fn(),
  },
}));

import { profileLifecycleService } from "../../../src/services/opening/profileLifecycleService.js";
import {
  presignCandidateProfiles,
  uploadCandidateProfiles,
} from "../../../src/controllers/vendor/openings/vendorOpeningController.js";
import {
  softDeleteProfile,
  previewProfile,
} from "../../../src/controllers/vendor/profiles/vendorProfileController.js";

describe("Profile Controllers - HTTP & Status Code Handling", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("presignCandidateProfiles", () => {
    it("returns 400 for invalid/empty opening ID", async () => {
      mockReq = {
        params: { id: "  " },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: { files: [{ filename: "resume.pdf", contentType: "application/pdf" }] },
      };

      await presignCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for unsupported file extension", async () => {
      mockReq = {
        params: { id: "op-1" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: { files: [{ filename: "resume.docx", contentType: "application/pdf" }] },
      };

      await presignCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Allowed formats") })
      );
    });

    it("returns 404 when opening not found in tenant", async () => {
      mockReq = {
        params: { id: "op-notfound" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: { files: [{ filename: "resume.pdf", contentType: "application/pdf" }] },
      };

      (profileLifecycleService.generateCandidatePresignedUrls as any).mockResolvedValueOnce(
        null
      );

      await presignCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 with presigned items on success", async () => {
      mockReq = {
        params: { id: "op-1" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: { files: [{ filename: "resume.pdf", contentType: "application/pdf" }] },
      };

      const mockItems = [{ filename: "resume.pdf", uploadUrl: "http://s3.url" }];
      (profileLifecycleService.generateCandidatePresignedUrls as any).mockResolvedValueOnce(
        { items: mockItems }
      );

      await presignCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockItems,
      });
    });
  });

  describe("uploadCandidateProfiles", () => {
    it("returns 400 when profiles array is missing or empty", async () => {
      mockReq = {
        params: { id: "op-1" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: { profiles: [] },
      };

      await uploadCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when S3 key prefix is foreign or invalid", async () => {
      mockReq = {
        params: { id: "op-1" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: {
          profiles: [
            { s3Key: "foreign-tenant/foreign-op/123_cv.pdf", originalFilename: "cv.pdf" },
          ],
        },
      };

      (profileLifecycleService.submitCandidateProfiles as any).mockResolvedValueOnce({
        success: false,
        reason: "INVALID_S3_KEY_PREFIX",
      });

      await uploadCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Invalid S3 key prefix") })
      );
    });

    it("returns 409 when S3 key is a duplicate", async () => {
      mockReq = {
        params: { id: "op-1" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: {
          profiles: [
            { s3Key: "t1/op-1/100_cv.pdf", originalFilename: "cv.pdf" },
          ],
        },
      };

      (profileLifecycleService.submitCandidateProfiles as any).mockResolvedValueOnce({
        success: false,
        reason: "DUPLICATE_S3_KEY",
        duplicateKey: "t1/op-1/100_cv.pdf",
      });

      await uploadCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Duplicate S3 key") })
      );
    });

    it("returns 201 on successful atomic submission", async () => {
      mockReq = {
        params: { id: "op-1" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
        body: {
          profiles: [
            { s3Key: "t1/op-1/100_cv.pdf", originalFilename: "cv.pdf" },
          ],
        },
      };

      const mockCreated = [{ id: 1, s3Key: "t1/op-1/100_cv.pdf" }];
      (profileLifecycleService.submitCandidateProfiles as any).mockResolvedValueOnce({
        success: true,
        profiles: mockCreated,
      });

      await uploadCandidateProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success", data: mockCreated })
      );
    });
  });

  describe("softDeleteProfile", () => {
    it("returns 404 when profile not found or owned by another vendor", async () => {
      mockReq = {
        params: { id: "99" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
      };

      (profileLifecycleService.softDeleteVendorProfile as any).mockResolvedValueOnce(
        false
      );

      await softDeleteProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 on successful soft delete", async () => {
      mockReq = {
        params: { id: "10" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
      };

      (profileLifecycleService.softDeleteVendorProfile as any).mockResolvedValueOnce(
        true
      );

      await softDeleteProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Profile deleted successfully",
      });
    });
  });

  describe("previewProfile", () => {
    it("returns 404 when previewing a profile outside vendor scope or deleted", async () => {
      mockReq = {
        params: { id: "99" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
      };

      (profileLifecycleService.getProfilePreview as any).mockResolvedValueOnce(
        null
      );

      await previewProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 with presigned GET preview URL", async () => {
      mockReq = {
        params: { id: "10" },
        user: { id: "v1", tenant: { tenantId: "t1" } },
      };

      const mockPreview = {
        profileId: 10,
        originalFilename: "resume.pdf",
        previewUrl: "https://s3.get-url",
        expiresIn: 3600,
      };

      (profileLifecycleService.getProfilePreview as any).mockResolvedValueOnce(
        mockPreview
      );

      await previewProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPreview,
      });
    });
  });
});

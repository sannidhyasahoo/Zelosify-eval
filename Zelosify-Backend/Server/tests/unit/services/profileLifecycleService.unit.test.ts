import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("../../../src/config/prisma/prisma.js", () => ({
  default: {
    opening: {
      findFirst: vi.fn(),
    },
    hiringProfile: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

const mockStorageService = {
  getUploadURL: vi.fn().mockResolvedValue("https://s3.amazonaws.com/test-bucket/upload-url"),
  getObjectURL: vi.fn().mockResolvedValue("https://s3.amazonaws.com/test-bucket/preview-url"),
};

vi.mock("../../../src/services/storage/storageFactory.js", () => ({
  createStorageService: vi.fn(() => mockStorageService),
}));

import prisma from "../../../src/config/prisma/prisma.js";
import { profileLifecycleService } from "../../../src/services/opening/profileLifecycleService.js";
import {
  validatePresignFile,
  validatePresignFilesList,
  validateS3KeyPrefix,
} from "../../../src/helpers/profileUploadValidation.js";

describe("ProfileLifecycleService - Upload, Submission, Soft-Delete & Preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Vendor can presign valid PDF
  it("1. Vendor can presign valid PDF and generates valid presigned URL and encrypted token", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce({
      id: "opening-123",
      tenantId: "tenant-wayne",
      status: "OPEN",
    });

    const result = await profileLifecycleService.generateCandidatePresignedUrls({
      openingId: "opening-123",
      tenantId: "tenant-wayne",
      files: [
        {
          filename: "resume.pdf",
          contentType: "application/pdf",
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].filename).toBe("resume.pdf");
    expect(result!.items[0].uploadUrl).toBe("https://s3.amazonaws.com/test-bucket/upload-url");
    expect(result!.items[0].uploadToken).toBeDefined();
    expect(result!.items[0].s3Key).toMatch(/^tenant-wayne\/opening-123\/\d+_resume\.pdf$/);
    expect(mockStorageService.getUploadURL).toHaveBeenCalledWith(
      result!.items[0].s3Key,
      "application/pdf"
    );
  });

  // 2. Vendor can presign valid PPTX
  it("2. Vendor can presign valid PPTX presentation format", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce({
      id: "opening-123",
      tenantId: "tenant-wayne",
      status: "OPEN",
    });

    const result = await profileLifecycleService.generateCandidatePresignedUrls({
      openingId: "opening-123",
      tenantId: "tenant-wayne",
      files: [
        {
          filename: "portfolio.pptx",
          contentType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].filename).toBe("portfolio.pptx");
    expect(result!.items[0].s3Key).toMatch(/^tenant-wayne\/opening-123\/\d+_portfolio\.pptx$/);
    expect(mockStorageService.getUploadURL).toHaveBeenCalledWith(
      result!.items[0].s3Key,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
  });

  // 3. Unsupported file type rejected
  it("3. Unsupported file types, mismatched extensions, and traversal paths are rejected", () => {
    // Unsupported extension
    const outcome1 = validatePresignFile({
      filename: "resume.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(outcome1.isValid).toBe(false);
    expect(outcome1.error).toContain("Allowed formats: .pdf, .pptx");

    // Mismatched MIME type
    const outcome2 = validatePresignFile({
      filename: "resume.pdf",
      contentType: "image/png",
    });
    expect(outcome2.isValid).toBe(false);
    expect(outcome2.error).toContain("Content-Type mismatch");

    // Path traversal
    const outcome3 = validatePresignFile({
      filename: "../../malicious.pdf",
      contentType: "application/pdf",
    });
    expect(outcome3.isValid).toBe(false);
    expect(outcome3.error).toContain("Path traversal detected");

    // Over maximum file count limit (11 files)
    const elevenFiles = Array.from({ length: 11 }, (_, i) => ({
      filename: `resume_${i}.pdf`,
      contentType: "application/pdf",
    }));
    const listOutcome = validatePresignFilesList(elevenFiles);
    expect(listOutcome.isValid).toBe(false);
    expect(listOutcome.error).toContain("Cannot request more than 10 files");
  });

  // 4. Cross-tenant opening cannot generate presign
  it("4. Cross-tenant opening cannot generate presign (returns null)", async () => {
    // Opening does not exist in vendor's tenant
    (prisma.opening.findFirst as any).mockResolvedValueOnce(null);

    const result = await profileLifecycleService.generateCandidatePresignedUrls({
      openingId: "opening-lexcorp",
      tenantId: "tenant-wayne",
      files: [{ filename: "resume.pdf", contentType: "application/pdf" }],
    });

    expect(prisma.opening.findFirst).toHaveBeenCalledWith({
      where: {
        id: "opening-lexcorp",
        tenantId: "tenant-wayne",
      },
      select: { id: true, status: true },
    });

    expect(result).toBeNull();
  });

  // 5. Generated key contains authenticated tenant ID + opening ID
  it("5. Generated S3 key strictly contains authenticated tenant ID + opening ID", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce({
      id: "op-abc",
      tenantId: "ten-xyz",
      status: "OPEN",
    });

    const result = await profileLifecycleService.generateCandidatePresignedUrls({
      openingId: "op-abc",
      tenantId: "ten-xyz",
      files: [{ filename: "cv.pdf", contentType: "application/pdf" }],
    });

    expect(result!.items[0].s3Key.startsWith("ten-xyz/op-abc/")).toBe(true);
  });

  // 6. Submission rejects foreign S3 prefix
  it("6. Submission rejects foreign S3 prefix not matching tenantId/openingId", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce({ id: "opening-1" });

    // Submitting a foreign key from a different tenant
    const foreignResult = await profileLifecycleService.submitCandidateProfiles({
      openingId: "opening-1",
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-1",
      profiles: [
        {
          s3Key: "other-tenant/opening-1/123_resume.pdf",
          originalFilename: "resume.pdf",
        },
      ],
    });

    expect(foreignResult.success).toBe(false);
    expect(foreignResult.reason).toBe("INVALID_S3_KEY_PREFIX");

    // Direct helper check
    expect(
      validateS3KeyPrefix(
        "other-tenant/opening-1/123_resume.pdf",
        "tenant-wayne",
        "opening-1"
      )
    ).toBe(false);

    expect(
      validateS3KeyPrefix(
        "tenant-wayne/opening-1/123_resume.pdf",
        "tenant-wayne",
        "opening-1"
      )
    ).toBe(true);
  });

  // 7. Multi-profile submission uses Prisma transaction
  it("7. Multi-profile submission creates records within one atomic Prisma transaction", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce({ id: "opening-1" });
    (prisma.hiringProfile.findMany as any).mockResolvedValueOnce([]); // No existing keys

    const mockCreated = [
      { id: 1, s3Key: "tenant-wayne/opening-1/100_a.pdf" },
      { id: 2, s3Key: "tenant-wayne/opening-1/101_b.pdf" },
    ];
    (prisma.$transaction as any).mockResolvedValueOnce(mockCreated);

    const result = await profileLifecycleService.submitCandidateProfiles({
      openingId: "opening-1",
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-user-1",
      profiles: [
        {
          s3Key: "tenant-wayne/opening-1/100_a.pdf",
          originalFilename: "resume_a.pdf",
        },
        {
          s3Key: "tenant-wayne/opening-1/101_b.pdf",
          originalFilename: "resume_b.pdf",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.profiles).toEqual(mockCreated);
  });

  // 8. Duplicate s3Key handled cleanly
  it("8. Duplicate s3Key is detected and rejected cleanly without DB writes", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce({ id: "opening-1" });

    // Internal duplicate in same request
    const internalDupResult = await profileLifecycleService.submitCandidateProfiles({
      openingId: "opening-1",
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-user-1",
      profiles: [
        { s3Key: "tenant-wayne/opening-1/100_dup.pdf", originalFilename: "dup1.pdf" },
        { s3Key: "tenant-wayne/opening-1/100_dup.pdf", originalFilename: "dup2.pdf" },
      ],
    });

    expect(internalDupResult.success).toBe(false);
    expect(internalDupResult.reason).toBe("DUPLICATE_S3_KEY");

    // Existing key in database
    (prisma.opening.findFirst as any).mockResolvedValueOnce({ id: "opening-1" });
    (prisma.hiringProfile.findMany as any).mockResolvedValueOnce([
      { s3Key: "tenant-wayne/opening-1/100_exists.pdf" },
    ]);

    const dbDupResult = await profileLifecycleService.submitCandidateProfiles({
      openingId: "opening-1",
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-user-1",
      profiles: [
        { s3Key: "tenant-wayne/opening-1/100_exists.pdf", originalFilename: "resume.pdf" },
      ],
    });

    expect(dbDupResult.success).toBe(false);
    expect(dbDupResult.reason).toBe("DUPLICATE_S3_KEY");
  });

  // 9. Vendor can soft-delete own profile
  it("9. Vendor can soft-delete own profile and updates isDeleted to true", async () => {
    (prisma.hiringProfile.findFirst as any).mockResolvedValueOnce({
      id: 42,
      uploadedBy: "vendor-1",
      isDeleted: false,
    });
    (prisma.hiringProfile.update as any).mockResolvedValueOnce({
      id: 42,
      isDeleted: true,
    });

    const deleted = await profileLifecycleService.softDeleteVendorProfile({
      profileId: 42,
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-1",
    });

    expect(deleted).toBe(true);
    expect(prisma.hiringProfile.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { isDeleted: true },
    });
  });

  // 10. Vendor cannot soft-delete another vendor's profile
  it("10. Vendor cannot soft-delete another vendor's profile (returns false)", async () => {
    // Profile belongs to vendor-2, query for vendor-1 yields null
    (prisma.hiringProfile.findFirst as any).mockResolvedValueOnce(null);

    const deleted = await profileLifecycleService.softDeleteVendorProfile({
      profileId: 99,
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-1",
    });

    expect(prisma.hiringProfile.findFirst).toHaveBeenCalledWith({
      where: {
        id: 99,
        uploadedBy: "vendor-1",
        isDeleted: false,
        opening: {
          tenantId: "tenant-wayne",
        },
      },
      select: { id: true },
    });

    expect(deleted).toBe(false);
    expect(prisma.hiringProfile.update).not.toHaveBeenCalled();
  });

  // 11. Vendor can preview own active profile
  it("11. Vendor can preview own active profile and receives presigned GET URL with expiry", async () => {
    (prisma.hiringProfile.findFirst as any).mockResolvedValueOnce({
      id: 55,
      s3Key: "tenant-wayne/opening-1/100_candidate.pdf",
      originalFilename: "candidate.pdf",
      submittedAt: new Date(),
    });

    const preview = await profileLifecycleService.getProfilePreview({
      profileId: 55,
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-1",
    });

    expect(preview).not.toBeNull();
    expect(preview.profileId).toBe(55);
    expect(preview.originalFilename).toBe("candidate.pdf");
    expect(preview.previewUrl).toBe("https://s3.amazonaws.com/test-bucket/preview-url");
    expect(preview.expiresIn).toBe(3600);
    expect(mockStorageService.getObjectURL).toHaveBeenCalledWith(
      "tenant-wayne/opening-1/100_candidate.pdf"
    );
  });

  // 12. Vendor cannot preview another vendor's profile
  it("12. Vendor cannot preview another vendor's profile or soft-deleted profile (returns null)", async () => {
    (prisma.hiringProfile.findFirst as any).mockResolvedValueOnce(null);

    const preview = await profileLifecycleService.getProfilePreview({
      profileId: 77,
      tenantId: "tenant-wayne",
      vendorUserId: "vendor-1",
    });

    expect(preview).toBeNull();
    expect(mockStorageService.getObjectURL).not.toHaveBeenCalled();
  });
});

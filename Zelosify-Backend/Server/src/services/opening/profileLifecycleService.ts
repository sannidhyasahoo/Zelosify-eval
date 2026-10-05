import prisma from "../../config/prisma/prisma.js";
import { ProfileStatus, RecommendationStatus } from "@prisma/client";
import { createStorageService } from "../storage/storageFactory.js";
import { encrypt } from "../../utils/encryption/encryption.js";
import { sanitizeFilename } from "../../helpers/vendorRequestValidation.js";
import {
  PresignFileInput,
  ProfileSubmissionItem,
  validateS3KeyPrefix,
} from "../../helpers/profileUploadValidation.js";
import { UploadMetadata } from "../../types/typeIndex.js";

/**
 * Service managing the candidate profile upload, submission, soft deletion,
 * and preview lifecycle for IT Vendors.
 */
export class ProfileLifecycleService {
  /**
   * Generates secure S3 presigned upload URLs and encrypted upload tokens for candidate resumes.
   *
   * @param openingId - Target opening ID
   * @param tenantId - Authenticated vendor's tenant ID
   * @param files - List of validated file descriptors
   */
  async generateCandidatePresignedUrls(params: {
    openingId: string;
    tenantId: string;
    files: PresignFileInput[];
  }): Promise<{ items: any[] } | null> {
    const { openingId, tenantId, files } = params;

    // 1. Verify opening exists within this tenant
    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId,
      },
      select: { id: true, status: true },
    });

    if (!opening) {
      return null;
    }

    const storageService = createStorageService();
    const expiryDuration = 3600 * 1000; // 1 hour token / URL validity

    // 2. Generate presigned PUT URL and encrypted token for each file
    const items = await Promise.all(
      files.map(async (file, index) => {
        const sanitized = sanitizeFilename(file.filename);
        // Force timestamp uniqueness even if multiple files share identical names
        const timestamp = Date.now() + index;
        const s3Key = `${tenantId}/${openingId}/${timestamp}_${sanitized}`;

        // Get presigned upload URL using existing storage abstraction
        const uploadUrl = await storageService.getUploadURL(s3Key, file.contentType);

        // Package metadata into secure token
        const uploadMetadata: UploadMetadata = {
          key: s3Key,
          url: uploadUrl,
          filename: sanitized,
          tenantId,
          expiresAt: Date.now() + expiryDuration,
          customFields: {
            openingId,
            contentType: file.contentType,
            originalFilename: file.filename,
          },
        };

        const uploadToken = encrypt(JSON.stringify(uploadMetadata));

        return {
          filename: sanitized,
          originalFilename: file.filename,
          contentType: file.contentType,
          s3Key,
          uploadUrl,
          uploadToken,
          expiresAt: uploadMetadata.expiresAt,
        };
      })
    );

    return { items };
  }

  /**
   * Submits candidate profiles in ONE atomic Prisma transaction after validating
   * tenant S3 key prefixes and unique keys.
   *
   * @param openingId - Target opening ID
   * @param tenantId - Authenticated vendor's tenant ID
   * @param vendorUserId - Authenticated vendor's user ID
   * @param profiles - Submitted profile items
   */
  async submitCandidateProfiles(params: {
    openingId: string;
    tenantId: string;
    vendorUserId: string;
    profiles: ProfileSubmissionItem[];
  }): Promise<{
    success: boolean;
    reason?: string;
    invalidKey?: string;
    duplicateKey?: string;
    profiles?: any[];
  }> {
    const { openingId, tenantId, vendorUserId, profiles } = params;

    // 1. Verify opening belongs to the vendor's tenant
    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId,
      },
      select: { id: true },
    });

    if (!opening) {
      return { success: false, reason: "OPENING_NOT_FOUND" };
    }

    // 2. Strictly verify S3 keys match <authenticatedTenantId>/<openingId>/<filename>
    const seenKeys = new Set<string>();
    for (const profile of profiles) {
      if (!validateS3KeyPrefix(profile.s3Key, tenantId, openingId)) {
        return {
          success: false,
          reason: "INVALID_S3_KEY_PREFIX",
          invalidKey: profile.s3Key,
        };
      }

      if (seenKeys.has(profile.s3Key)) {
        return {
          success: false,
          reason: "DUPLICATE_S3_KEY",
          duplicateKey: profile.s3Key,
        };
      }
      seenKeys.add(profile.s3Key);
    }

    // 3. Pre-check for duplicate S3 keys already registered in DB
    const existing = await prisma.hiringProfile.findMany({
      where: {
        s3Key: { in: Array.from(seenKeys) },
      },
      select: { s3Key: true },
    });

    if (existing.length > 0) {
      return {
        success: false,
        reason: "DUPLICATE_S3_KEY",
        duplicateKey: existing[0].s3Key,
      };
    }

    // 4. Create all HiringProfile records in ONE atomic transaction
    try {
      const createdProfiles = await prisma.$transaction(
        profiles.map((p) =>
          prisma.hiringProfile.create({
            data: {
              openingId,
              s3Key: p.s3Key,
              originalFilename: p.originalFilename.trim(),
              uploadedBy: vendorUserId,
              status: ProfileStatus.SUBMITTED,
              recommendationStatus: RecommendationStatus.PENDING,
              isDeleted: false,
            },
          })
        )
      );

      return { success: true, profiles: createdProfiles };
    } catch (error: any) {
      // Prisma P2002 indicates unique constraint violation
      if (error?.code === "P2002") {
        return {
          success: false,
          reason: "DUPLICATE_S3_KEY",
        };
      }
      throw error;
    }
  }

  /**
   * Soft deletes a candidate profile. Enforces uploadedBy, tenant, and isDeleted = false.
   */
  async softDeleteVendorProfile(params: {
    profileId: number;
    tenantId: string;
    vendorUserId: string;
  }): Promise<boolean> {
    const { profileId, tenantId, vendorUserId } = params;

    const profile = await prisma.hiringProfile.findFirst({
      where: {
        id: profileId,
        uploadedBy: vendorUserId,
        isDeleted: false,
        opening: {
          tenantId,
        },
      },
      select: { id: true },
    });

    if (!profile) {
      return false;
    }

    await prisma.hiringProfile.update({
      where: { id: profile.id },
      data: { isDeleted: true },
    });

    return true;
  }

  /**
   * Generates a short-lived presigned GET URL for previewing a candidate resume.
   * Enforces uploadedBy, tenantId, and isDeleted = false.
   */
  async getProfilePreview(params: {
    profileId: number;
    tenantId: string;
    vendorUserId: string;
  }): Promise<any | null> {
    const { profileId, tenantId, vendorUserId } = params;

    const profile = await prisma.hiringProfile.findFirst({
      where: {
        id: profileId,
        uploadedBy: vendorUserId,
        isDeleted: false,
        opening: {
          tenantId,
        },
      },
      select: {
        id: true,
        s3Key: true,
        originalFilename: true,
        submittedAt: true,
      },
    });

    if (!profile) {
      return null;
    }

    const storageService = createStorageService();
    const previewUrl = await storageService.getObjectURL(profile.s3Key);

    return {
      profileId: profile.id,
      originalFilename: profile.originalFilename,
      previewUrl,
      expiresIn: 3600,
      expiresAt: Date.now() + 3600 * 1000,
    };
  }
}

export const profileLifecycleService = new ProfileLifecycleService();

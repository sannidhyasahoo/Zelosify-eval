import { Response } from "express";
import { AuthenticatedRequest } from "../../../types/typeIndex.js";
import { openingService } from "../../../services/opening/openingService.js";
import { recommendationDispatcher } from "../../../services/recommendation/recommendationDispatcher.js";

/**
 * Controller for IT_VENDOR opening endpoints
 */

/**
 * GET /api/v1/vendor/openings
 * Retrieves open, available job openings within the vendor's tenant
 */
export const listVendorOpenings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.user?.tenant?.tenantId || (req.user as any)?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        status: "error",
        error: "Unauthorized: User not associated with a tenant",
      });
      return;
    }

    const result = await openingService.getVendorOpenings(tenantId, req.query);

    res.status(200).json({
      status: "success",
      data: result.openings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[VendorOpenings] Error listing openings:", error);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * GET /api/v1/vendor/openings/:id
 * Retrieves a single opening by ID within the vendor's tenant, including
 * only the candidate profiles uploaded by this specific vendor.
 */
export const getVendorOpening = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.trim() === "") {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid opening ID",
      });
      return;
    }

    const tenantId = req.user?.tenant?.tenantId || (req.user as any)?.tenantId;
    const vendorUserId = req.user?.id;

    if (!tenantId || !vendorUserId) {
      res.status(401).json({
        status: "error",
        error: "Unauthorized: User credentials or tenant missing",
      });
      return;
    }

    const opening = await openingService.getVendorOpeningById(
      id.trim(),
      tenantId,
      vendorUserId
    );

    if (!opening) {
      // 404 returned if not found or outside tenant scope (avoids leaking existence)
      res.status(404).json({
        status: "error",
        error: "Opening not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: opening,
    });
  } catch (error: any) {
    console.error(`[VendorOpenings] Error getting opening ${req.params?.id}:`, error);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * POST /api/v1/vendor/openings/:id/profiles/presign
 * Generates presigned upload URLs and encrypted upload tokens for candidate files.
 */
export const presignCandidateProfiles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.trim() === "") {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid opening ID",
      });
      return;
    }

    const tenantId = req.user?.tenant?.tenantId || (req.user as any)?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        status: "error",
        error: "Unauthorized: User not associated with a tenant",
      });
      return;
    }

    const { files } = req.body;
    const { validatePresignFilesList } = await import(
      "../../../helpers/profileUploadValidation.js"
    );

    const validation = validatePresignFilesList(files);
    if (!validation.isValid) {
      res.status(400).json({
        status: "error",
        error: validation.error || "Validation failed for files list",
      });
      return;
    }

    const { profileLifecycleService } = await import(
      "../../../services/opening/profileLifecycleService.js"
    );

    const result = await profileLifecycleService.generateCandidatePresignedUrls({
      openingId: id.trim(),
      tenantId,
      files,
    });

    if (!result) {
      res.status(404).json({
        status: "error",
        error: "Opening not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: result.items,
    });
  } catch (error: any) {
    console.error(
      `[VendorOpenings] Error generating presigned URLs for opening ${req.params?.id}:`,
      error
    );
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * POST /api/v1/vendor/openings/:id/profiles/upload
 * Atomically submits uploaded candidate profiles in ONE transaction.
 */
export const uploadCandidateProfiles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.trim() === "") {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid opening ID",
      });
      return;
    }

    const tenantId = req.user?.tenant?.tenantId || (req.user as any)?.tenantId;
    const vendorUserId = req.user?.id;

    if (!tenantId || !vendorUserId) {
      res.status(401).json({
        status: "error",
        error: "Unauthorized: User credentials or tenant missing",
      });
      return;
    }

    const { profiles } = req.body;

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      res.status(400).json({
        status: "error",
        error: "Body must contain a non-empty 'profiles' array",
      });
      return;
    }

    if (profiles.length > 10) {
      res.status(400).json({
        status: "error",
        error: "Cannot submit more than 10 profiles in a single request",
      });
      return;
    }

    // Validate structure of each profile item
    for (const p of profiles) {
      if (!p || typeof p !== "object" || !p.s3Key || !p.originalFilename) {
        res.status(400).json({
          status: "error",
          error: "Each profile item must contain 's3Key' and 'originalFilename'",
        });
        return;
      }

      if (
        typeof p.originalFilename !== "string" ||
        p.originalFilename.trim() === "" ||
        p.originalFilename.includes("..")
      ) {
        res.status(400).json({
          status: "error",
          error: `Invalid originalFilename: ${p.originalFilename}`,
        });
        return;
      }
    }

    const { profileLifecycleService } = await import(
      "../../../services/opening/profileLifecycleService.js"
    );

    const result = await profileLifecycleService.submitCandidateProfiles({
      openingId: id.trim(),
      tenantId,
      vendorUserId,
      profiles,
    });

    if (!result.success) {
      if (result.reason === "OPENING_NOT_FOUND") {
        res.status(404).json({
          status: "error",
          error: "Opening not found",
        });
        return;
      }

      if (result.reason === "INVALID_S3_KEY_PREFIX") {
        res.status(400).json({
          status: "error",
          error: `Invalid S3 key prefix. Keys must start with ${tenantId}/${id.trim()}/`,
          invalidKey: result.invalidKey,
        });
        return;
      }

      if (result.reason === "DUPLICATE_S3_KEY") {
        res.status(409).json({
          status: "error",
          error: `Duplicate S3 key detected: ${result.duplicateKey || "Key already exists"}`,
        });
        return;
      }

      res.status(400).json({
        status: "error",
        error: "Failed to submit profiles",
      });
      return;
    }

    // Dispatch asynchronous recommendation processing without awaiting LLM completion
    const createdProfileIds = (result.profiles || []).map((p: any) => p.id);
    if (createdProfileIds.length > 0) {
      recommendationDispatcher.dispatch(createdProfileIds);
    }

    res.status(201).json({
      status: "success",
      message: "Candidate profiles submitted successfully",
      data: result.profiles,
    });
  } catch (error: any) {
    console.error(
      `[VendorOpenings] Error submitting profiles for opening ${req.params?.id}:`,
      error
    );
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

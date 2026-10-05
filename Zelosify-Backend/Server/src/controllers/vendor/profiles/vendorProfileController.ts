import { Response } from "express";
import { AuthenticatedRequest } from "../../../types/typeIndex.js";
import { profileLifecycleService } from "../../../services/opening/profileLifecycleService.js";

/**
 * Controller for IT_VENDOR individual candidate profile management (preview & soft-delete)
 */

/**
 * DELETE /api/v1/vendor/profiles/:id
 * Soft deletes a candidate profile. Enforces uploadedBy, tenantId, and isDeleted = false.
 */
export const softDeleteProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const profileId = parseInt(id, 10);
    if (isNaN(profileId) || profileId <= 0) {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid profile ID",
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

    const deleted = await profileLifecycleService.softDeleteVendorProfile({
      profileId,
      tenantId,
      vendorUserId,
    });

    if (!deleted) {
      // 404 returned if not found, owned by another vendor, or in another tenant
      res.status(404).json({
        status: "error",
        error: "Profile not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Profile deleted successfully",
    });
  } catch (error: any) {
    console.error(`[VendorProfiles] Error deleting profile ${req.params?.id}:`, error);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * GET /api/v1/vendor/profiles/:id/preview
 * Generates a short-lived presigned GET URL for previewing a candidate resume.
 * Enforces uploadedBy, tenantId, and isDeleted = false.
 */
export const previewProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const profileId = parseInt(id, 10);
    if (isNaN(profileId) || profileId <= 0) {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid profile ID",
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

    const result = await profileLifecycleService.getProfilePreview({
      profileId,
      tenantId,
      vendorUserId,
    });

    if (!result) {
      // 404 returned if not found, owned by another vendor, or in another tenant
      res.status(404).json({
        status: "error",
        error: "Profile not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error: any) {
    console.error(`[VendorProfiles] Error previewing profile ${req.params?.id}:`, error);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

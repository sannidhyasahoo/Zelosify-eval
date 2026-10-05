import { Response } from "express";
import { AuthenticatedRequest } from "../../../types/typeIndex.js";
import { openingService } from "../../../services/opening/openingService.js";

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

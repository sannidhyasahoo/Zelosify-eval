import { Response } from "express";
import { AuthenticatedRequest } from "../../types/typeIndex.js";
import { openingService } from "../../services/opening/openingService.js";

/**
 * Controller for HIRING_MANAGER opening and profile endpoints
 */

/**
 * GET /api/v1/hiring-manager/openings
 * Retrieves openings assigned to the authenticated Hiring Manager within their tenant
 */
export const listHiringManagerOpenings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.user?.tenant?.tenantId || (req.user as any)?.tenantId;
    const hiringManagerId = req.user?.id;

    if (!tenantId || !hiringManagerId) {
      res.status(401).json({
        status: "error",
        error: "Unauthorized: User credentials or tenant missing",
      });
      return;
    }

    const result = await openingService.getHiringManagerOpenings(
      tenantId,
      hiringManagerId,
      req.query
    );

    res.status(200).json({
      status: "success",
      data: result.openings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[HiringManagerOpenings] Error listing openings:", error);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * GET /api/v1/hiring-manager/openings/:id/profiles
 * Retrieves candidate profiles for an opening owned by the authenticated Hiring Manager
 * Enforces BOTH tenantId and hiringManagerId ownership.
 */
export const getHiringManagerOpeningProfiles = async (
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
    const hiringManagerId = req.user?.id;

    if (!tenantId || !hiringManagerId) {
      res.status(401).json({
        status: "error",
        error: "Unauthorized: User credentials or tenant missing",
      });
      return;
    }

    const result = await openingService.getHiringManagerOpeningProfiles(
      id.trim(),
      tenantId,
      hiringManagerId
    );

    if (!result) {
      // 404 returned if not found, outside tenant, or owned by a different manager
      res.status(404).json({
        status: "error",
        error: "Opening not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error: any) {
    console.error(
      `[HiringManagerOpenings] Error getting profiles for opening ${req.params?.id}:`,
      error
    );
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

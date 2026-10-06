import { Response } from "express";
import { AuthenticatedRequest } from "../../types/typeIndex.js";
import { hiringDecisionService } from "../../services/hiring/hiringDecisionService.js";

/**
 * Legacy/placeholder route handler
 */
export const fetchData = async (_req: any, res: Response): Promise<void> => {
  res.json({ message: "success", data: "Hiring Manager Service" });
};

/**
 * POST /api/v1/hiring-manager/profiles/:id/shortlist
 * Shortlists a candidate profile owned by the authenticated Hiring Manager.
 */
export const shortlistCandidateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const profileId = parseInt(req.params.id, 10);
    if (isNaN(profileId)) {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid profile ID",
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

    const updatedProfile = await hiringDecisionService.shortlistProfile({
      profileId,
      tenantId,
      hiringManagerId,
    });

    if (!updatedProfile) {
      res.status(404).json({
        status: "error",
        error: "Profile not found or not owned by hiring manager",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Candidate profile shortlisted successfully",
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error(
      `[HiringProfileController] Error shortlisting profile ${req.params?.id}:`,
      error
    );
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * POST /api/v1/hiring-manager/profiles/:id/reject
 * Rejects a candidate profile owned by the authenticated Hiring Manager.
 */
export const rejectCandidateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const profileId = parseInt(req.params.id, 10);
    if (isNaN(profileId)) {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid profile ID",
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

    const updatedProfile = await hiringDecisionService.rejectProfile({
      profileId,
      tenantId,
      hiringManagerId,
    });

    if (!updatedProfile) {
      res.status(404).json({
        status: "error",
        error: "Profile not found or not owned by hiring manager",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Candidate profile rejected successfully",
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error(
      `[HiringProfileController] Error rejecting profile ${req.params?.id}:`,
      error
    );
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * POST /api/v1/hiring-manager/profiles/:id/recommendation/retry
 * Re-queues a FAILED recommendation evaluation for an owned candidate profile.
 */
export const retryCandidateRecommendation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const profileId = parseInt(req.params.id, 10);
    if (isNaN(profileId)) {
      res.status(400).json({
        status: "error",
        error: "Bad request: Invalid profile ID",
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

    const result = await hiringDecisionService.retryRecommendation({
      profileId,
      tenantId,
      hiringManagerId,
    });

    if (!result.success) {
      if (result.reason === "NOT_FOUND") {
        res.status(404).json({
          status: "error",
          error: "Profile not found or not owned by hiring manager",
        });
        return;
      }

      if (result.reason === "ALREADY_COMPLETED") {
        res.status(400).json({
          status: "error",
          error: "Recommendation is already completed and cannot be retried",
        });
        return;
      }

      if (result.reason === "ALREADY_PROCESSING") {
        res.status(409).json({
          status: "error",
          error: "Recommendation is currently being processed",
        });
        return;
      }
    }

    res.status(202).json({
      status: "success",
      message: "Recommendation evaluation scheduled for retry",
      profileId,
    });
  } catch (error: any) {
    console.error(
      `[HiringProfileController] Error retrying recommendation for profile ${req.params?.id}:`,
      error
    );
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

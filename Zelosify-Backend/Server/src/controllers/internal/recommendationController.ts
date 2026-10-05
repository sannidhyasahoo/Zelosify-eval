import { Request, Response } from "express";
import { processRecommendation } from "../../services/recommendation/recommendationService.js";

/**
 * Controller to trigger candidate recommendation evaluation.
 * Accessible via internal authenticated endpoint for testing or manual processing.
 */
export async function runRecommendationHandler(req: Request, res: Response): Promise<void> {
  try {
    const profileId = parseInt(req.params.profileId, 10);
    if (isNaN(profileId)) {
      res.status(400).json({ error: "Invalid profileId parameter." });
      return;
    }

    const result = await processRecommendation(profileId);
    res.status(200).json({
      success: true,
      data: result,
    });
    return;
  } catch (err: any) {
    if (err.message?.includes("not found") || err.message?.includes("deleted")) {
      res.status(404).json({ error: err.message });
      return;
    }
    res
      .status(500)
      .json({ error: err.message || "Failed to process recommendation" });
    return;
  }
}

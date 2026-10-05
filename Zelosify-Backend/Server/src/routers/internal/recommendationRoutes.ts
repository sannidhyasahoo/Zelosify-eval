import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { runRecommendationHandler } from "../../controllers/internal/recommendationController.js";

const router = Router();

// Internal route to run recommendation for a profile, authenticated
router.post("/:profileId/run", authenticateUser, runRecommendationHandler);

export default router;

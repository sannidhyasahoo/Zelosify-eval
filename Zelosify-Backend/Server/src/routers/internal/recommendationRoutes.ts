import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { runRecommendationHandler } from "../../controllers/internal/recommendationController.js";

const router = Router();

// Internal route to run recommendation for a profile, strictly restricted to ADMIN role
router.post(
  "/:profileId/run",
  authenticateUser,
  authorizeRole("ADMIN"),
  runRecommendationHandler
);

export default router;

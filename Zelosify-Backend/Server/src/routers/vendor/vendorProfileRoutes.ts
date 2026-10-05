import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  softDeleteProfile,
  previewProfile,
} from "../../controllers/controllers.js";

/**
 * Router for IT_VENDOR individual candidate profile actions (soft delete & preview)
 * All routes require authentication and IT_VENDOR role
 */
const router = Router();

/**
 * DELETE /api/v1/vendor/profiles/:id
 * Soft deletes an active candidate profile submitted by this vendor
 */
router.delete(
  "/:id",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  softDeleteProfile as RequestHandler
);

/**
 * GET /api/v1/vendor/profiles/:id/preview
 * Generates a temporary presigned GET URL for previewing the candidate resume
 */
router.get(
  "/:id/preview",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  previewProfile as RequestHandler
);

export default router;

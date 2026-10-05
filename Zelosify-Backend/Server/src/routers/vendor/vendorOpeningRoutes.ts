import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  listVendorOpenings,
  getVendorOpening,
} from "../../controllers/controllers.js";

/**
 * Router for IT_VENDOR opening endpoints
 * All routes require authentication and IT_VENDOR role
 */
const router = Router();

/**
 * GET /api/v1/vendor/openings
 * Retrieves paginated open job openings for the vendor's tenant
 */
router.get(
  "/",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  listVendorOpenings as RequestHandler
);

/**
 * GET /api/v1/vendor/openings/:id
 * Retrieves a single opening by ID along with the vendor's uploaded profiles
 */
router.get(
  "/:id",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  getVendorOpening as RequestHandler
);

export default router;

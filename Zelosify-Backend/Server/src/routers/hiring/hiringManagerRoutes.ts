import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  fetchData,
  listHiringManagerOpenings,
  getHiringManagerOpeningProfiles,
} from "../../controllers/controllers.js";

const router = Router();

/**
 * =============================================================================
 * HIRING MANAGER ROUTES - VACANCY MANAGEMENT
 * =============================================================================
 */

/**
 * GET /api/v1/hiring-manager
 * @requires HIRING_MANAGER role
 */
router.get(
  "/",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  (async (req, res, next) => {
    try {
      await fetchData(req as any, res);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/v1/hiring-manager/openings
 * Retrieves openings assigned to the authenticated Hiring Manager
 * @requires HIRING_MANAGER role
 */
router.get(
  "/openings",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  listHiringManagerOpenings as RequestHandler
);

/**
 * GET /api/v1/hiring-manager/openings/:id/profiles
 * Retrieves candidate profiles for an opening owned by the authenticated Hiring Manager
 * @requires HIRING_MANAGER role
 */
router.get(
  "/openings/:id/profiles",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  getHiringManagerOpeningProfiles as RequestHandler
);

export default router;

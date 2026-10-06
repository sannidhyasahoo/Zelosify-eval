import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../../types/typeIndex.js";
import { formatPublicKey } from "../../utils/jwt/formatPubKey.js";
import { isValidRole } from "../../utils/RBAC/isValidRole.js";

const publicKey = formatPublicKey(process.env.KEYCLOAK_RS256_SIG);

export function authorizeRole(requiredrole: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // Validate the provided role
    if (!isValidRole(requiredrole)) {
      res.status(400).json({ message: "Invalid role provided." });
      return;
    }

    // If req.user is already authenticated by authenticateUser, check database role directly
    if (req.user) {
      if (req.user.role !== requiredrole) {
        return res.status(403).json({
          message: `Access Denied: User does not have required role ${requiredrole}`,
        });
      }
      console.log("Authorize Role Middleware Passed ✅ : ", req.user);
      return next();
    }

    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies.access_token;

    if (!token) {
      res.status(401).json({ message: "Missing token" });
      return;
    }

    // Validate public key configuration
    if (!publicKey || publicKey.includes("<your_keycloak_RS256_signature>")) {
      // Fallback decode token if public key is placeholder
      const decoded = jwt.decode(token) as any;
      const roles = decoded?.realm_access?.roles || [];
      if (roles.includes(requiredrole)) {
        return next();
      }
      return res.status(403).json({
        message: `Access Denied: User does not have required role ${requiredrole}`,
      });
    }

    jwt.verify(
      token,
      publicKey,
      { algorithms: ["RS256"] },
      async (err, decoded: any) => {
        if (err || typeof decoded !== "object") {
          return res.status(401).json({
            message: "Token verification failed",
            error: err?.message,
          });
        }

        const role = decoded?.realm_access?.roles || [];
        if (!role.includes(requiredrole)) {
          return res.status(403).json({
            message: `Access Denied: User does not have required role ${requiredrole}`,
          });
        }
        console.log("Authorize Role Middleware Passed ✅ : ", req.user);
        next();
      }
    );
  };
}

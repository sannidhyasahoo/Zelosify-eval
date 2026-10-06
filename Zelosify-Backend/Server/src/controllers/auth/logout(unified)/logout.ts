import { Response, Request } from "express";
import asyncHandler from "../../../utils/handler/asyncHandler.js";
import { getAdminToken } from "../../../utils/keycloak/getAdminToken.js";
import { getClientSecret } from "../../../config/keycloak/keycloak.js";
import axios from "axios";

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken =
        req.cookies?.refresh_token || req.headers.authorization?.split(" ")[1];
      const user = (req as any).user;
      console.log("Processing logout for user/token...", { hasRefreshToken: !!refreshToken });

      if (refreshToken) {
        try {
          const adminToken = await getAdminToken();
          const clientSecret = await getClientSecret(adminToken);
          if (clientSecret) {
            await axios.post(
              `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
              new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: clientSecret,
                refresh_token: refreshToken,
              }),
              { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            console.log("Keycloak session invalidated successfully.");
          }
        } catch (kcErr: any) {
          console.warn(
            "Keycloak logout request notice (session may already be expired):",
            kcErr.response?.data || kcErr.message
          );
        }
      }

      // Always clear cookies securely
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      res.clearCookie("access_token", cookieOptions);
      res.clearCookie("refresh_token", cookieOptions);
      res.clearCookie("role", { path: "/" });
      console.log("Auth cookies cleared successfully.");

      res.status(200).json({ message: "Logged out successfully" });
      return;
    } catch (error: any) {
      console.error("Logout caught error, ensuring cookies cleared:", error.message);
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/" });
      res.clearCookie("role", { path: "/" });
      res.status(200).json({ message: "Logged out successfully" });
      return;
    }
  }
);


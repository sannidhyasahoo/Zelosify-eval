import axios from "axios";
import { Request, Response } from "express";
import prisma from "../../../../config/prisma/prisma.js";
import { getKeycloakClientSecret } from "../../../../utils/keycloak/getKeycloakClientSecret.js";
import {
  LoginSuccessResponse,
  LoginTOTPRequiredResponse,
} from "../../../../types/auth.js";
import { generateTempToken } from "../../../../utils/jwt/generateTempToken.js";

/**
 * Verify user login credentials (step 1 of 2FA)
 * @param req - Express request with LoginCredentials body
 * @param res - Express response with login status
 */
export const verifyLogin = async (
  req: Request<{}, any, { usernameOrEmail: string; password: string }>,
  res: Response
): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res
        .status(400)
        .json({ message: "Username/Email and password are required" });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        department: true,
        provider: true,
        tenantId: true,
        totpSecret: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    if (user.provider !== "KEYCLOAK") {
      res
        .status(400)
        .json({ message: "This login method is for Keycloak users only" });
      return;
    }

    const clientSecret = await getKeycloakClientSecret();

    console.log("🔹 Attempting Keycloak login with:", user.username || user.email);

    let tokenResponse;
    try {
      const primaryUsername = user.username || user.email;
      tokenResponse = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: "password",
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: clientSecret,
          username: primaryUsername,
          password,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
    } catch (err: any) {
      if (user.email && user.email !== user.username) {
        try {
          tokenResponse = await axios.post(
            `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
            new URLSearchParams({
              grant_type: "password",
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: clientSecret,
              username: user.email,
              password,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          );
        } catch (fallbackErr: any) {
          console.error(
            "❌ Keycloak authentication failed:",
            fallbackErr.response?.data || fallbackErr.message
          );
          res.status(401).json({ message: "Invalid credentials" });
          return;
        }
      } else {
        console.error(
          "❌ Keycloak authentication failed:",
          err.response?.data || err.message
        );
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
    }

    // Complete direct login for accounts without TOTP configured; enforce 2FA when totpSecret is set
    const bypassTOTP = !user.totpSecret;

    if (bypassTOTP) {
      console.log(
        `🔹 User ${user.username || user.email} logging in directly (no 2FA secret configured)`
      );

      // Extract tokens from Keycloak response
      const { access_token, refresh_token } = tokenResponse.data;

      // Update user's tokens in the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
        },
      });

      // Set access token in cookie
      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 4 * 3600 * 1000, // 4 hours
        path: "/",
      });

      // Set refresh token in cookie
      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      // Set role cookie for immediate client/middleware access
      if (user.role) {
        res.cookie("role", user.role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 4 * 3600 * 1000,
          path: "/",
        });
      }

      const redirectPath =
        user.role === "HIRING_MANAGER"
          ? "/hiring-manager/openings"
          : user.role === "IT_VENDOR"
          ? "/vendor/openings"
          : "/user";

      // Send the response using proper interface
      const successResponse: LoginSuccessResponse = {
        success: true,
        message: "Authentication successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          department: user.department,
          provider: user.provider,
          tenantId: user.tenantId,
        },
        redirectTo: redirectPath,
      };

      res.json(successResponse);
      return;
    }

    // Normal flow for users with TOTP configured
    const refreshToken = tokenResponse.data.refresh_token;
    const tempToken = generateTempToken(user.id, refreshToken);

    res.cookie("temp_token", tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60 * 1000, // 5 minutes
      path: "/",
    });

    const totpResponse: LoginTOTPRequiredResponse = {
      message: "Login verified. Please enter your TOTP code.",
    };

    res.json(totpResponse);
  } catch (error) {
    console.error("❌ Error verifying login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

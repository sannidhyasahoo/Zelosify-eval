import { Request, Response } from "express";
import prisma from "../../../../config/prisma/prisma.js";
import { authenticator } from "otplib";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Verifies the initial TOTP configuration after user registration.
 */
export const verifyInitialTOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { totp } = req.body;
    const token =
      req.cookies?.registration_token ||
      req.cookies?.temp_token ||
      req.cookies?.access_token;

    if (!token || !totp) {
      res.status(400).json({
        message: "Registration session or TOTP code missing.",
      });
      return;
    }

    let userId: string | undefined;

    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      userId = (decoded as any)?.userId || decoded?.sub;
    } catch (err) {
      // Ignored
    }

    if (!userId) {
      res.status(400).json({
        message: "Registration session expired. Please register again.",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { externalId: userId }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        totpSecret: true,
        tenantId: true,
      },
    });

    if (!user || !user.totpSecret) {
      res.status(404).json({
        message: "User not found or TOTP not initialized.",
      });
      return;
    }

    const isValid = authenticator.verify({
      token: String(totp).trim(),
      secret: user.totpSecret,
    });

    if (!isValid) {
      res.status(401).json({
        message: "Invalid verification code. Please try again.",
      });
      return;
    }

    // Mark profile complete
    await prisma.user.update({
      where: { id: user.id },
      data: { profileComplete: true },
    });

    // Clear the temporary registration token cookie
    res.clearCookie("registration_token", { path: "/" });

    // Set/refresh role cookie
    res.cookie("role", user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "TOTP verified successfully",
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("verifyInitialTOTP error:", error);
    res.status(500).json({ message: "Error verifying initial TOTP." });
  }
};

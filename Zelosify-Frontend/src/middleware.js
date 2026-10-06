import { NextResponse } from "next/server";
import { extractRoleFromToken, isTokenExpired } from "@/utils/Auth/middlewareUtils";

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define auth entry pages
  const isAuthPage =
    path === "/login" ||
    path === "/register" ||
    path === "/setup-totp";

  // Check if we have auth cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const registrationToken = request.cookies.get("registration_token")?.value;

  // A user is considered authenticated if they have BOTH tokens and access token is NOT expired
  const tokenExpired = isTokenExpired(accessToken);
  const isAuthenticated = !!accessToken && !!refreshToken && !tokenExpired;
  const isRegistering = !!registrationToken;

  const response = NextResponse.next();
  let userRole = null;

  if (isAuthenticated && accessToken) {
    userRole = extractRoleFromToken(accessToken);

    if (userRole) {
      // Set role cookie that JavaScript can read
      response.cookies.set("role", userRole, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    } else {
      response.cookies.delete("role");
    }
  } else if (!isAuthenticated) {
    // Clear stale auth cookies when not authenticated or token is expired
    response.cookies.delete("role");
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
  }

  // Special case: Registration flow
  if (isRegistering) {
    if (path !== "/setup-totp") {
      return NextResponse.redirect(new URL("/setup-totp", request.url));
    }
    return response;
  }

  // Redirect authenticated users away from login/register pages
  if (isAuthPage && isAuthenticated) {
    switch (userRole) {
      case "VENDOR_MANAGER":
        return NextResponse.redirect(new URL("/user", request.url));

      case "BUSINESS_USER":
        return NextResponse.redirect(
          new URL("/business-user/digital-initiative", request.url)
        );

      case "IT_VENDOR":
        return NextResponse.redirect(new URL("/vendor/openings", request.url));

      case "HIRING_MANAGER":
        return NextResponse.redirect(
          new URL("/hiring-manager/openings", request.url)
        );

      default:
        return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect unauthenticated users trying to access protected paths
  if (!isAuthPage && !isAuthenticated) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    redirectResponse.cookies.delete("role");
    redirectResponse.cookies.delete("access_token");
    redirectResponse.cookies.delete("refresh_token");
    return redirectResponse;
  }

  return response;
}


// Configure middleware to run only on specific paths
export const config = {
  matcher: [
    // Protected routes
    "/user/:path*",
    "/vendor/:path*",
    "/business-user/:path*",
    "/hiring-manager/:path*",

    // Public paths for redirect logic
    "/login",
    "/register",
    "/setup-totp",
  ],
};

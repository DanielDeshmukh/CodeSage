import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/repositories", "/exam", "/results", "/settings"];
const authRoutes = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Skip auth in E2E test mode
  if (process.env.E2E_TEST === "true") {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|error-logo.png|banner.png|globe.svg|tab-icon.ico).*)",
  ],
};

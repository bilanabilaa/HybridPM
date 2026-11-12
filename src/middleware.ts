import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hybridpm-default-super-secret-key-2026"
);

const PUBLIC_PATHS = ["/", "/login", "/forgot-password", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  // Check if public path
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path);

  const token = req.cookies.get("hybridpm_session")?.value;
  let session = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload;
    } catch {
      // Invalid token
    }
  }

  // If user is logged in and trying to access /login, redirect to /dashboard
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If trying to access protected path without valid session
  if (!isPublic && !session && !pathname.startsWith("/api/auth")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role check for /admin paths: only ADMIN role can access
  if (pathname.startsWith("/admin") && session) {
    const role = (session as any).role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth/logout|_next/static|_next/image|favicon.ico).*)"],
};


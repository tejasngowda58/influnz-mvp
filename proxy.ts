import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const ROLE_HOME: Record<UserRole, string> = {
  CREATOR: "/dashboard/creator",
  BRAND: "/dashboard/brand",
  ADMIN: "/dashboard/admin",
};

/** Route prefixes only one role may reach at all. */
const ROLE_ONLY_PREFIXES: { prefix: string; role: UserRole }[] = [
  { prefix: "/dashboard/creator", role: "CREATOR" },
  { prefix: "/dashboard/brand", role: "BRAND" },
  { prefix: "/dashboard/admin", role: "ADMIN" },
  { prefix: "/api/admin", role: "ADMIN" },
  { prefix: "/api/creator-profile", role: "CREATOR" },
  { prefix: "/api/instagram/connect", role: "CREATOR" },
  { prefix: "/api/instagram/disconnect", role: "CREATOR" },
];

/**
 * Coarse auth gate in front of the app. Route handlers and pages keep their own
 * `requireRole()` / session checks — this is defence in depth, not a replacement,
 * and per-method authorization (which role may PATCH what) stays in the handlers.
 *
 * Note: Next.js 16 renamed Middleware to Proxy; this file is the former
 * `middleware.ts`. Proxy runs on the Node.js runtime by default.
 */
export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");
  const role = request.auth?.user?.role;

  if (!role) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  const roleOnly = ROLE_ONLY_PREFIXES.find((entry) => pathname.startsWith(entry.prefix));
  if (roleOnly && roleOnly.role !== role) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/creator-profile",
    "/api/instagram/connect",
    "/api/instagram/disconnect",
    "/api/campaigns",
    "/api/campaigns/:path*",
    "/api/applications/:path*",
  ],
};

import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getInstagramAuthorizeUrl } from "@/lib/instagram";

export const STATE_COOKIE = "ig_oauth_state";

export async function GET(request: NextRequest) {
  const session = await auth();
  const origin = request.nextUrl.origin;

  if (!session?.user || session.user.role !== "CREATOR") {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(getInstagramAuthorizeUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });
  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  fetchInstagramProfile,
} from "@/lib/instagram";
import { STATE_COOKIE } from "../connect/route";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const session = await auth();

  if (!session?.user || session.user.role !== "CREATOR") {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  if (error) {
    return NextResponse.redirect(new URL("/dashboard/creator?instagram_error=denied", origin));
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/dashboard/creator?instagram_error=invalid_state", origin));
  }

  try {
    const { accessToken: shortLivedToken } = await exchangeCodeForShortLivedToken(code);
    const { accessToken, expiresInSeconds } = await exchangeForLongLivedToken(shortLivedToken);
    const profile = await fetchInstagramProfile(accessToken);

    if (profile.accountType === "PERSONAL") {
      return NextResponse.redirect(
        new URL("/dashboard/creator?instagram_error=personal_account", origin),
      );
    }

    await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: {
        instagramUserId: profile.id,
        instagramHandle: profile.username,
        followerCount: profile.followersCount,
        instagramProfilePictureUrl: profile.profilePictureUrl,
        instagramAccessToken: encryptSecret(accessToken),
        instagramTokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        instagramConnectedAt: new Date(),
      },
    });

    const response = NextResponse.redirect(new URL("/dashboard/creator?instagram=connected", origin));
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    console.error("Instagram connect failed", err);
    return NextResponse.redirect(new URL("/dashboard/creator?instagram_error=failed", origin));
  }
}

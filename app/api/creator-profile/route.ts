import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UpdateCreatorProfileBody {
  bio?: string;
  followerCount?: number | null;
  /** A `data:image/...` URL, already downscaled in the browser. */
  avatarUrl?: string | null;
}

/**
 * Avatars are stored inline as data URLs rather than in object storage: this
 * project has no bucket yet, and the browser downscales to a thumbnail before
 * upload. The cap keeps a pathological payload out of the database.
 */
const MAX_AVATAR_CHARS = 400_000;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CREATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateCreatorProfileBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.followerCount !== undefined && body.followerCount !== null) {
    const followerCountNumber = Number(body.followerCount);
    if (!Number.isInteger(followerCountNumber) || followerCountNumber < 0) {
      return NextResponse.json(
        { error: "followerCount must be a non-negative whole number" },
        { status: 400 },
      );
    }
  }

  if (body.avatarUrl !== undefined && body.avatarUrl !== null) {
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(body.avatarUrl)) {
      return NextResponse.json(
        { error: "avatarUrl must be a PNG, JPEG, or WebP data URL" },
        { status: 400 },
      );
    }
    if (body.avatarUrl.length > MAX_AVATAR_CHARS) {
      return NextResponse.json({ error: "That image is too large." }, { status: 413 });
    }
  }

  const creatorProfile = await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(body.bio !== undefined ? { bio: body.bio.trim() || null } : {}),
      ...(body.followerCount !== undefined
        ? { followerCount: body.followerCount === null ? null : Math.round(Number(body.followerCount)) }
        : {}),
      ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
    },
  });

  return NextResponse.json({ creatorProfile });
}

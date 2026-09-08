import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UpdateCreatorProfileBody {
  bio?: string;
  followerCount?: number | null;
}

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

  const creatorProfile = await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(body.bio !== undefined ? { bio: body.bio.trim() || null } : {}),
      ...(body.followerCount !== undefined
        ? { followerCount: body.followerCount === null ? null : Math.round(Number(body.followerCount)) }
        : {}),
    },
  });

  return NextResponse.json({ creatorProfile });
}

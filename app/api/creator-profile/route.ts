import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UpdateCreatorProfileBody {
  bio?: string;
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

  const creatorProfile = await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(body.bio !== undefined ? { bio: body.bio.trim() || null } : {}),
    },
  });

  return NextResponse.json({ creatorProfile });
}

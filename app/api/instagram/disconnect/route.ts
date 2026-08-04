import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CLEARED_INSTAGRAM_FIELDS } from "@/lib/instagram";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CREATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.creatorProfile.update({
    where: { userId: session.user.id },
    data: CLEARED_INSTAGRAM_FIELDS,
  });

  return NextResponse.json({ ok: true });
}

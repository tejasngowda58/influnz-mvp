import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface MarkReadBody {
  /** Specific notifications to mark read; omit to mark the whole inbox read. */
  ids?: string[];
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: MarkReadBody = {};
  try {
    body = await request.json();
  } catch {
    // An empty body means "mark everything read".
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
      ...(body.ids?.length ? { id: { in: body.ids } } : {}),
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ updated: result.count });
}

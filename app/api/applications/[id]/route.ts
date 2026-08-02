import { NextResponse } from "next/server";
import type { ApplicationStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_TRANSITIONS } from "@/lib/application-status";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BRAND") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nextStatus = body.status as ApplicationStatus | undefined;
  if (!nextStatus || !(nextStatus in ALLOWED_TRANSITIONS)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { campaign: { include: { brand: true } } },
  });

  if (!application || application.campaign.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (!ALLOWED_TRANSITIONS[application.status].includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot move from ${application.status} to ${nextStatus}` },
      { status: 409 },
    );
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status: nextStatus },
  });

  return NextResponse.json({ application: updated });
}

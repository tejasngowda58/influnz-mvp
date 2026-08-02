import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  if (body.status !== "OPEN" && body.status !== "CLOSED") {
    return NextResponse.json({ error: "status must be OPEN or CLOSED" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { brand: true } });
  if (!campaign || campaign.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ campaign: updated });
}

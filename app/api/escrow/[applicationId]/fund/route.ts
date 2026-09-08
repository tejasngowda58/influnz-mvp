import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { platformFeeInPaise, rupeesToPaise } from "@/lib/money";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  razorpayPublicKey,
} from "@/lib/razorpay";

/**
 * Opens a Razorpay order so the brand can fund escrow for an agreed deal.
 *
 * The amount is always recomputed from the confirmed application — the client
 * sends nothing but the URL. Funding itself is only recognised when Razorpay's
 * webhook confirms the capture; this route just starts the checkout.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BRAND") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured on this environment yet." },
      { status: 503 },
    );
  }

  const { applicationId } = await params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      escrow: true,
      creator: { select: { name: true } },
      campaign: { include: { brand: true } },
    },
  });

  if (!application || application.campaign.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: `Only confirmed deals can be funded (this one is ${application.status})` },
      { status: 409 },
    );
  }

  if (application.escrow && application.escrow.status !== "PENDING") {
    return NextResponse.json(
      { error: `Escrow is already ${application.escrow.status}` },
      { status: 409 },
    );
  }

  const amountPaise = rupeesToPaise(application.proposedBudget);
  const platformFee = platformFeeInPaise(amountPaise);

  let order;
  try {
    order = await createRazorpayOrder({
      amountPaise,
      // Razorpay caps receipts at 40 chars.
      receipt: `esc_${application.id.replace(/-/g, "").slice(0, 34)}`,
      notes: {
        applicationId: application.id,
        campaignId: application.campaignId,
        campaignTitle: application.campaign.title.slice(0, 250),
      },
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    return NextResponse.json(
      { error: "Couldn't start the payment. Please try again." },
      { status: 502 },
    );
  }

  const escrow = await prisma.escrowTransaction.upsert({
    where: { applicationId: application.id },
    create: {
      applicationId: application.id,
      amount: amountPaise,
      platformFee,
      razorpayOrderId: order.id,
      status: "PENDING",
    },
    update: {
      // A previous unpaid attempt is replaced; the old order simply expires.
      amount: amountPaise,
      platformFee,
      razorpayOrderId: order.id,
    },
  });

  return NextResponse.json({
    escrowId: escrow.id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayPublicKey(),
    campaignTitle: application.campaign.title,
    creatorName: application.creator.name,
  });
}

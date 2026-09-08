/**
 * Money handling for escrow.
 *
 * Campaign budgets and negotiated offers are stored as whole rupees (`Int`),
 * because that is what brands and creators type. Escrow rows and Razorpay both
 * work in paise, so every amount crossing into the payment layer goes through
 * `rupeesToPaise` first. Nothing here ever reads an amount from a client.
 */

const DEFAULT_PLATFORM_FEE_PERCENT = 10;

/** Influnz's cut, taken from the funded amount when escrow is released. */
export function platformFeePercent(): number {
  const raw = process.env.PLATFORM_FEE_PERCENT;
  if (raw == null || raw.trim() === "") {
    return DEFAULT_PLATFORM_FEE_PERCENT;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`PLATFORM_FEE_PERCENT must be a percentage between 0 and 100, got "${raw}"`);
  }

  return parsed;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Fee on a deal, in paise. Rounded down so the creator is never short-changed by rounding. */
export function platformFeeInPaise(amountPaise: number): number {
  return Math.floor((amountPaise * platformFeePercent()) / 100);
}

/** What actually reaches the creator once the fee is taken. */
export function creatorPayoutInPaise(amountPaise: number, feePaise: number): number {
  return Math.max(0, amountPaise - feePaise);
}

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paiseToRupees(paise));
}

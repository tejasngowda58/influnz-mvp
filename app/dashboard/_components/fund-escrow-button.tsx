"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayCheckout {
  open: () => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string }) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("checkout failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("checkout failed to load"));
    document.body.appendChild(script);
  });
}

export function FundEscrowButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/escrow/${applicationId}/fund`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Couldn't start the payment. Please try again.");
        setLoading(false);
        return;
      }

      await loadCheckoutScript();
      if (!window.Razorpay) {
        setError("Couldn't load the payment window. Please try again.");
        setLoading(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Influnz",
        description: `Escrow for ${data.campaignTitle}`,
        order_id: data.orderId,
        theme: { color: "#ea580c" },
        // The webhook is what actually funds escrow. This handler only tells
        // the person what to expect, so we never claim success the server
        // hasn't confirmed.
        handler: () => {
          setAwaitingConfirmation(true);
          setLoading(false);
          router.refresh();
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      checkout.open();
    } catch {
      setError("Couldn't start the payment. Please try again.");
      setLoading(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Confirming your payment with Razorpay…
        </p>
        <p className="text-xs text-gray-500">
          This usually takes a few seconds. The creator is notified the moment it clears.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.refresh()}>
          Check again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" size="sm" disabled={loading} onClick={startCheckout}>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        {loading ? "Opening payment…" : "Fund escrow"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

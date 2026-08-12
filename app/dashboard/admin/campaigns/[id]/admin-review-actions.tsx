"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";

type ReviewAction = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

const COMMENT_TONE: Record<ReviewAction, string> = {
  APPROVE: "",
  REQUEST_CHANGES: "border-orange-200 bg-orange-50/40",
  REJECT: "border-red-200 bg-red-50/40",
};

export function AdminReviewActions({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [showCommentFor, setShowCommentFor] = useState<ReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<ReviewAction | null>(null);

  async function submit(action: ReviewAction) {
    if (action !== "APPROVE" && !comment.trim()) {
      setShowCommentFor(action);
      setError("Add a comment explaining what needs to change.");
      return;
    }

    setError(null);
    setLoading(action);

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(null);
        return;
      }

      router.push("/dashboard/admin/campaigns");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {showCommentFor && (
        <div className={`rounded-xl border p-4 ${COMMENT_TONE[showCommentFor]}`}>
          <TextAreaField
            label={showCommentFor === "REJECT" ? "Reason for rejection" : "What needs to change"}
            id="comment"
            placeholder="Explain what the brand should fix or why this was rejected"
            value={comment}
            onChange={setComment}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={loading !== null} onClick={() => submit("APPROVE")}>
          {loading === "APPROVE" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading !== null}
          onClick={() =>
            showCommentFor === "REQUEST_CHANGES" ? submit("REQUEST_CHANGES") : setShowCommentFor("REQUEST_CHANGES")
          }
        >
          {loading === "REQUEST_CHANGES" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {showCommentFor === "REQUEST_CHANGES" ? "Confirm & send" : "Request changes"}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={loading !== null}
          onClick={() => (showCommentFor === "REJECT" ? submit("REJECT") : setShowCommentFor("REJECT"))}
        >
          {loading === "REJECT" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {showCommentFor === "REJECT" ? "Confirm rejection" : "Reject"}
        </Button>
      </div>
    </div>
  );
}

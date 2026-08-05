"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";

type ReviewAction = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

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
        <TextAreaField
          label={showCommentFor === "REJECT" ? "Reason for rejection" : "What needs to change"}
          id="comment"
          placeholder="Explain what the brand should fix or why this was rejected"
          value={comment}
          onChange={setComment}
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={loading !== null} onClick={() => submit("APPROVE")}>
          {loading === "APPROVE" ? "Approving..." : "Approve"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading !== null}
          onClick={() => (showCommentFor === "REQUEST_CHANGES" ? submit("REQUEST_CHANGES") : setShowCommentFor("REQUEST_CHANGES"))}
        >
          {loading === "REQUEST_CHANGES" ? "Sending..." : "Request changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={loading !== null}
          onClick={() => (showCommentFor === "REJECT" ? submit("REJECT") : setShowCommentFor("REJECT"))}
        >
          {loading === "REJECT" ? "Rejecting..." : "Reject"}
        </Button>
      </div>
    </div>
  );
}

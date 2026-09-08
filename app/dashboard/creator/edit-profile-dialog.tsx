"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Field, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";
import { Dialog } from "@/app/_components/ui/dialog";

interface EditProfileDialogProps {
  bio: string;
  followerCount: number | null;
}

export function EditProfileDialog({ bio: initialBio, followerCount: initialFollowerCount }: EditProfileDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [followerCount, setFollowerCount] = useState(
    initialFollowerCount != null ? String(initialFollowerCount) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openDialog() {
    setBio(initialBio);
    setFollowerCount(initialFollowerCount != null ? String(initialFollowerCount) : "");
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (followerCount.trim() && !(Number.isInteger(Number(followerCount)) && Number(followerCount) >= 0)) {
      setError("Follower count must be a non-negative whole number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/creator-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          followerCount: followerCount.trim() ? Number(followerCount) : null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openDialog} className="gap-1.5">
        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
        Edit profile
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit your profile"
        description="This is what brands see when they view your profile."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Follower count"
            id="followerCount"
            type="number"
            placeholder="e.g. 12000"
            value={followerCount}
            onChange={(value) => {
              setFollowerCount(value);
              setError(null);
            }}
          />
          <TextAreaField
            label="Bio"
            id="bio"
            placeholder="Tell brands about your content, your audience, and what makes you a great fit for a collab."
            value={bio}
            onChange={(value) => {
              setBio(value);
              setError(null);
            }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-1 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

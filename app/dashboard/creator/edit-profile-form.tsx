"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";

interface EditProfileFormProps {
  bio: string;
  followerCount: string;
}

export function EditProfileForm({ bio: initialBio, followerCount: initialFollowerCount }: EditProfileFormProps) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (followerCount.trim() && !(Number(followerCount) >= 0)) {
      setError("Enter a valid follower count");
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

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextAreaField
        label="Bio"
        id="bio"
        placeholder="Tell brands about your content, your audience, and what makes you a great fit for a collab."
        value={bio}
        onChange={(value) => {
          setBio(value);
          setSuccess(false);
        }}
      />
      <Field
        label="Follower count"
        id="followerCount"
        type="number"
        placeholder="e.g. 12000"
        value={followerCount}
        onChange={(value) => {
          setFollowerCount(value);
          setSuccess(false);
        }}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated — this is what brands see.</p>}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

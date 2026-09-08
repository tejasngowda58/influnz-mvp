"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { Field, TextAreaField } from "@/app/_components/field";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import { Dialog } from "@/app/_components/ui/dialog";
import { ProfileCardShell } from "../_components/profile-card-shell";
import { ConnectInstagramButton } from "./connect-instagram-button";

/** Downscale in the browser so the stored data URL stays small. */
const MAX_AVATAR_PX = 256;

interface OwnProfileProps {
  name: string;
  instagramHandle: string | null;
  instagramProfilePictureUrl: string | null;
  avatarUrl: string | null;
  category: string;
  city: string;
  followerCount: number | null;
  bio: string | null;
  instagramConnected: boolean;
}

function readImageAsDownscaledDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That file isn't a readable image"));
      image.onload = () => {
        const scale = Math.min(1, MAX_AVATAR_PX / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Couldn't process that image"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * The creator's own view of their profile.
 *
 * A brand-new profile renders as visibly empty — no photo, no bio, no follower
 * count — so the job here is to turn that emptiness into a to-do list rather
 * than a dead end, and to put each fix next to the gap it belongs to.
 */
export function OwnProfile({
  name,
  instagramHandle,
  instagramProfilePictureUrl,
  avatarUrl,
  category,
  city,
  followerCount,
  bio,
  instagramConnected,
}: OwnProfileProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftBio, setDraftBio] = useState(bio ?? "");
  const [draftFollowers, setDraftFollowers] = useState(
    followerCount != null ? String(followerCount) : "",
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoUrl = instagramProfilePictureUrl ?? avatarUrl;

  const checklist = [
    { key: "photo", label: "Add a profile photo", done: Boolean(photoUrl) },
    { key: "bio", label: "Write a short bio", done: Boolean(bio?.trim()) },
    { key: "followers", label: "Add your follower count", done: followerCount != null },
  ];
  const doneCount = checklist.filter((item) => item.done).length;
  const isComplete = doneCount === checklist.length;
  const percent = Math.round((doneCount / checklist.length) * 100);

  function openDialog() {
    setDraftBio(bio ?? "");
    setDraftFollowers(followerCount != null ? String(followerCount) : "");
    setError(null);
    setDialogOpen(true);
  }

  async function save(payload: Record<string, unknown>) {
    const response = await fetch("/api/creator-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Something went wrong. Please try again.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (
      draftFollowers.trim() &&
      !(Number.isInteger(Number(draftFollowers)) && Number(draftFollowers) >= 0)
    ) {
      setError("Follower count must be a non-negative whole number");
      return;
    }

    setSaving(true);
    try {
      await save({
        bio: draftBio,
        followerCount: draftFollowers.trim() ? Number(draftFollowers) : null,
      });
      setDialogOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const dataUrl = await readImageAsDownscaledDataUrl(file);
      await save({ avatarUrl: dataUrl });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  const inlinePrompt = (label: string) => (
    <button
      type="button"
      onClick={openDialog}
      className="rounded-full border border-dashed border-ember/40 px-2.5 py-0.5 text-xs font-semibold text-ember transition-colors hover:bg-ember-tint"
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* One place to finish the profile, instead of two competing prompts. */}
      {isComplete ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-settled">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            Your profile is complete
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={openDialog}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            Edit profile
          </Button>
        </Card>
      ) : (
        <Card radius="surface" className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg text-strong">Finish your profile</h2>
              <p className="mt-0.5 text-sm text-muted">
                Brands pick creators they can size up. {doneCount} of {checklist.length} done.
              </p>
            </div>
            <Button type="button" size="sm" onClick={openDialog}>
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit profile
            </Button>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ember transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ul className="flex flex-col gap-2.5">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`inline-flex h-4 w-4 flex-none items-center justify-center rounded-full ${
                    item.done ? "bg-settled text-white" : "border border-line-strong"
                  }`}
                >
                  {item.done && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                </span>
                <span className={item.done ? "text-muted line-through" : "text-strong"}>
                  {item.label}
                </span>
                {!item.done && item.key === "photo" && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-ember underline underline-offset-2"
                  >
                    Upload
                  </button>
                )}
                {!item.done && item.key !== "photo" && (
                  <button
                    type="button"
                    onClick={openDialog}
                    className="text-xs font-semibold text-ember underline underline-offset-2"
                  >
                    Add
                  </button>
                )}
              </li>
            ))}

            {!instagramConnected && (
              <li className="flex flex-wrap items-center gap-2.5 border-t border-line pt-2.5 text-sm">
                <span className="inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-dashed border-line-strong" />
                <span className="text-muted">Verify with Instagram</span>
                <Badge tone="neutral">Coming soon</Badge>
                <ConnectInstagramButton variant="ghost" />
              </li>
            )}
          </ul>
        </Card>
      )}

      {error && <p className="text-sm text-stopped">{error}</p>}

      <div>
        <p className="mb-3 text-sm text-muted">
          This is exactly what brands see when browsing the creator directory.
        </p>

        <ProfileCardShell
          name={name}
          handle={instagramHandle}
          photoUrl={photoUrl}
          verified={instagramConnected}
          category={category}
          city={city}
          followerCount={followerCount}
          bio={bio}
          avatarAction={
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change your profile photo"
              className="absolute -right-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-ember text-white transition-colors hover:bg-ember-dark"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </button>
          }
          followerFallback={inlinePrompt("Add followers")}
          bioFallback={inlinePrompt("Add a bio so brands know why you're a fit")}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleAvatarPicked}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Edit your profile"
        description="Brands see this when they view you in the directory."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Follower count"
            id="followerCount"
            type="number"
            placeholder="e.g. 12000"
            value={draftFollowers}
            onChange={(value) => {
              setDraftFollowers(value);
              setError(null);
            }}
          />
          <TextAreaField
            label="Bio"
            id="bio"
            placeholder="Tell brands about your content, your audience, and what makes you a great fit for a collab."
            value={draftBio}
            onChange={(value) => {
              setDraftBio(value);
              setError(null);
            }}
          />
          {error && <p className="text-sm text-stopped">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

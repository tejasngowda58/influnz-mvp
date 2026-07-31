import type { ContentCategory } from "@prisma/client";

export const CONTENT_CATEGORY_OPTIONS: { value: ContentCategory; label: string }[] = [
  { value: "FASHION", label: "Fashion" },
  { value: "BEAUTY", label: "Beauty" },
  { value: "TECH", label: "Tech" },
  { value: "FOOD", label: "Food" },
  { value: "FITNESS", label: "Fitness" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OTHER", label: "Other" },
];

export const CONTENT_CATEGORY_VALUES: ContentCategory[] = CONTENT_CATEGORY_OPTIONS.map(
  (option) => option.value,
);

export const CATEGORY_LABELS: Record<ContentCategory, string> = {
  FASHION: "Fashion",
  BEAUTY: "Beauty",
  TECH: "Tech",
  FOOD: "Food",
  FITNESS: "Fitness",
  TRAVEL: "Travel",
  OTHER: "Other",
};

export const CATEGORY_BADGE_CLASSES: Record<ContentCategory, string> = {
  FASHION: "bg-pink-50 text-pink-600",
  BEAUTY: "bg-rose-50 text-rose-600",
  TECH: "bg-blue-50 text-blue-600",
  FOOD: "bg-amber-50 text-amber-600",
  FITNESS: "bg-emerald-50 text-emerald-600",
  TRAVEL: "bg-sky-50 text-sky-600",
  OTHER: "bg-gray-100 text-gray-600",
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

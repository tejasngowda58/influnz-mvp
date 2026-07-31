"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { CONTENT_CATEGORY_OPTIONS } from "@/lib/creator-display";

interface CreatorFiltersProps {
  category: string;
  city: string;
}

export function CreatorFilters({ category, city }: CreatorFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(updates: { category?: string; city?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextCategory = updates.category ?? category;
    const nextCity = updates.city ?? city;

    if (nextCategory) {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    if (nextCity) {
      params.set("city", nextCity);
    } else {
      params.delete("city");
    }

    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    apply({ city: String(formData.get("city") ?? "").trim() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
    >
      <select
        name="category"
        defaultValue={category}
        onChange={(event) => apply({ category: event.target.value })}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none sm:w-56"
      >
        <option value="">All Categories</option>
        {CONTENT_CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="city"
        defaultValue={city}
        placeholder="Filter by city"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none sm:w-56"
      />
      <button
        type="submit"
        className="rounded-full bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
      >
        Apply
      </button>
    </form>
  );
}

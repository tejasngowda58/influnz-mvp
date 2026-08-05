import { LinkButton } from "@/app/_components/ui/button";
import { CONTENT_CATEGORIES } from "@/lib/content-categories";

const INPUT_CLASSES =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-600";

interface FilterBarProps {
  action: string;
  category?: string;
  city?: string;
  search?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
}

export function FilterBar({
  action,
  category = "",
  city = "",
  search = "",
  searchLabel = "Search",
  searchPlaceholder,
}: FilterBarProps) {
  const hasFilters = Boolean(category || city || search);

  return (
    <form
      method="GET"
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4"
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <label htmlFor="search" className="text-xs font-medium text-gray-500">
          {searchLabel}
        </label>
        <input
          id="search"
          name="search"
          defaultValue={search}
          placeholder={searchPlaceholder}
          className={INPUT_CLASSES}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-xs font-medium text-gray-500">
          Category
        </label>
        <select id="category" name="category" defaultValue={category} className={INPUT_CLASSES}>
          <option value="">All categories</option>
          {CONTENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="city" className="text-xs font-medium text-gray-500">
          City
        </label>
        <input
          id="city"
          name="city"
          defaultValue={city}
          placeholder="Any city"
          className={INPUT_CLASSES}
        />
      </div>
      <button
        type="submit"
        className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100"
      >
        Filter
      </button>
      {hasFilters && (
        <LinkButton href={action} variant="ghost" size="sm">
          Clear
        </LinkButton>
      )}
    </form>
  );
}

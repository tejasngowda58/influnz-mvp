/**
 * Labelled facts instead of a dot-joined string.
 *
 * "Mumbai · Beauty · ₹40,000" makes the reader work out what each value is;
 * labelling them costs a line and removes the guesswork.
 */
export interface MetaItem {
  label: string;
  value: React.ReactNode;
}

export function MetaRow({ items, className = "" }: { items: MetaItem[]; className?: string }) {
  return (
    <dl className={`flex flex-wrap gap-x-8 gap-y-3 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-micro font-semibold text-muted/80">{item.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium text-strong">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

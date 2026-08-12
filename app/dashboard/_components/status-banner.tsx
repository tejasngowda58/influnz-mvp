export type StatusBannerTone = "orange" | "red" | "gray";

const TONE_CLASSES: Record<StatusBannerTone, string> = {
  orange: "border-orange-100 bg-orange-50/50",
  red: "border-red-100 bg-red-50/50",
  gray: "border-gray-100 bg-gray-50",
};

const TITLE_CLASSES: Record<StatusBannerTone, string> = {
  orange: "text-orange-600",
  red: "text-red-600",
  gray: "text-gray-500",
};

interface StatusBannerProps {
  tone: StatusBannerTone;
  title: string;
  children: React.ReactNode;
}

export function StatusBanner({ tone, title, children }: StatusBannerProps) {
  return (
    <div className={`rounded-xl border p-4 ${TONE_CLASSES[tone]}`}>
      <h3 className={`text-xs font-medium tracking-wide uppercase ${TITLE_CLASSES[tone]}`}>{title}</h3>
      <div className="mt-1 text-sm text-gray-700">{children}</div>
    </div>
  );
}

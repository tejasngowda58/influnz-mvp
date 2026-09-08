export type StatusBannerTone = "orange" | "red" | "gray" | "green";

const TONE_CLASSES: Record<StatusBannerTone, string> = {
  orange: "border-ember/20 bg-ember-tint",
  red: "border-stopped/20 bg-stopped/5",
  gray: "border-line bg-paper",
  green: "border-settled/20 bg-settled/5",
};

const TITLE_CLASSES: Record<StatusBannerTone, string> = {
  orange: "text-ember-dark",
  red: "text-stopped",
  gray: "text-muted",
  green: "text-settled",
};

interface StatusBannerProps {
  tone: StatusBannerTone;
  title: string;
  children: React.ReactNode;
}

export function StatusBanner({ tone, title, children }: StatusBannerProps) {
  return (
    <div className={`rounded-inset border p-4 ${TONE_CLASSES[tone]}`}>
      <h3 className={`text-xs font-medium ${TITLE_CLASSES[tone]}`}>{title}</h3>
      <div className="mt-1 text-sm text-strong">{children}</div>
    </div>
  );
}

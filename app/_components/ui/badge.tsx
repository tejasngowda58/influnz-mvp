export type BadgeTone = "orange" | "gray" | "green" | "red" | "blue";

const TONE_CLASSES: Record<BadgeTone, string> = {
  orange: "bg-orange-50 text-orange-600",
  gray: "bg-gray-100 text-gray-600",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tone = "orange", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

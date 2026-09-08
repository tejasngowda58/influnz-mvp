/**
 * Elevation here is a border and a background step, never a drop shadow —
 * identical rounded cards all wearing the same shadow is the single most
 * recognisable "generated dashboard" tell. Radius carries hierarchy instead:
 * page-level surfaces are rounder than the cards inside them.
 */
type CardRadius = "surface" | "card";

const RADIUS_CLASSES: Record<CardRadius, string> = {
  surface: "rounded-surface",
  card: "rounded-card",
};

interface CardProps {
  radius?: CardRadius;
  className?: string;
  children: React.ReactNode;
}

export function Card({ radius = "card", className = "", children }: CardProps) {
  return (
    <div className={`border border-line bg-surface ${RADIUS_CLASSES[radius]} ${className}`}>
      {children}
    </div>
  );
}

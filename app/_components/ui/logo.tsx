interface LogoProps {
  className?: string;
  inverted?: boolean;
}

export function Logo({ className = "", inverted = false }: LogoProps) {
  return (
    <span
      className={`text-xl font-semibold tracking-tight ${inverted ? "text-white" : "text-strong"} ${className}`}
    >
      Influ
      <span className={inverted ? "text-ember-tint" : "text-ember-dark"}>nz</span>
    </span>
  );
}

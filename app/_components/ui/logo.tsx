interface LogoProps {
  className?: string;
  inverted?: boolean;
}

export function Logo({ className = "", inverted = false }: LogoProps) {
  return (
    <span
      className={`text-xl font-semibold tracking-tight ${inverted ? "text-white" : "text-gray-900"} ${className}`}
    >
      Influ
      <span className={inverted ? "text-orange-200" : "text-orange-600"}>nz</span>
    </span>
  );
}

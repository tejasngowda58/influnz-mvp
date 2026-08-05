interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = "", children }: CardProps) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white ${className}`}>{children}</div>
  );
}

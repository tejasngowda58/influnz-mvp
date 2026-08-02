import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-orange-600"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} />
      {label}
    </Link>
  );
}

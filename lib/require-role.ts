import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

/**
 * Ensures the current request has a session with the given role,
 * redirecting to /login otherwise. Returns the session when valid.
 */
export async function requireRole(role: UserRole) {
  const session = await auth();

  if (!session?.user || session.user.role !== role) {
    redirect("/login");
  }

  return session;
}

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

/** For pages any signed-in role may see, like the notification inbox. */
export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

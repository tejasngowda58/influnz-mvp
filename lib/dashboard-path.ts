import type { UserRole } from "@prisma/client";

/**
 * Maps a user's role to the dashboard route they should land on after login.
 * Kept in its own module (no server-only imports) so it can be safely
 * imported from client components like the login page.
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "CREATOR":
      return "/dashboard/creator";
    case "BRAND":
      return "/dashboard/brand";
  }
}

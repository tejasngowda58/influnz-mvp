import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

/**
 * Auth config shared by the full server instance (`lib/auth.ts`) and `proxy.ts`.
 * Deliberately free of Prisma and bcrypt imports: the proxy only needs to decode
 * an already-issued session JWT, and pulling native modules into the proxy bundle
 * breaks it. Providers live in `lib/auth.ts` because only sign-in needs them.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

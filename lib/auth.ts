import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDashboardPath } from "@/lib/dashboard-path";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
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
});

/**
 * Ensures the current request has a session whose role matches `role`
 * (a single role, or one of several allowed roles). Redirects to /login if
 * there's no session, or to the signed-in user's own dashboard if their
 * role doesn't match what the route expects. Returns the session when valid.
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(session.user.role)) {
    redirect(getDashboardPath(session.user.role));
  }

  return session;
}

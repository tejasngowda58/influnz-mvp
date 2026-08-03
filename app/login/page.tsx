"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Field } from "../_components/field";
import { AuthShell } from "../_components/auth-shell";
import { Button } from "../_components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;

    if (role === "CREATOR") {
      router.push("/dashboard/creator");
    } else if (role === "ADMIN") {
      router.push("/dashboard/admin");
    } else {
      router.push("/dashboard/brand");
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Pick up right where you left off"
      pitch="Log in to manage your collaborations, track applications, and stay on top of every conversation between creators and brands."
    >
      <h1 className="text-2xl font-semibold text-gray-900">Log in</h1>
      <p className="mt-2 text-sm text-gray-600">
        Welcome back. Enter your credentials to continue.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        New to Influnz?{" "}
        <Link href="/signup/creator" className="font-medium text-orange-600 hover:text-orange-700">
          Sign up as a creator
        </Link>{" "}
        or{" "}
        <Link href="/signup/brand" className="font-medium text-orange-600 hover:text-orange-700">
          as a brand
        </Link>
        .
      </p>
    </AuthShell>
  );
}

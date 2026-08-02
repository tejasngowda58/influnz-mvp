"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field, SelectField } from "../../_components/field";
import { AuthShell } from "../../_components/auth-shell";
import { Button } from "../../_components/ui/button";
import { CONTENT_CATEGORIES } from "@/lib/content-categories";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  phone: string;
  instagramHandle: string;
  contentCategory: string;
  city: string;
  followerCount: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialFormState: FormState = {
  name: "",
  email: "",
  phone: "",
  instagramHandle: "",
  contentCategory: "",
  city: "",
  followerCount: "",
  password: "",
};

export default function CreatorSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required";
    if (!form.instagramHandle.trim()) nextErrors.instagramHandle = "Instagram handle is required";
    if (!form.contentCategory) nextErrors.contentCategory = "Select a content category";
    if (!form.city.trim()) nextErrors.city = "City is required";
    if (form.followerCount.trim() && !(Number(form.followerCount) >= 0)) {
      nextErrors.followerCount = "Enter a valid follower count";
    }
    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/signup/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          followerCount: form.followerCount.trim() ? Number(form.followerCount) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!result || result.error) {
        setSubmitError("Account created, but automatic sign-in failed. Please log in.");
        setLoading(false);
        router.push("/login");
        return;
      }

      router.push("/dashboard/creator");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="For creators"
      title="Get discovered, get paid"
      pitch="Build a profile that showcases your content and audience, get matched with brands looking for creators like you, and negotiate collaborations securely."
    >
      <h1 className="text-2xl font-semibold text-gray-900">
        Sign up as a Creator
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Create your creator profile and start connecting with brands.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Field
            label="Name"
            id="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(value) => updateField("name", value)}
            error={errors.name}
          />
          <Field
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(value) => updateField("email", value)}
            error={errors.email}
          />
          <Field
            label="Phone"
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(value) => updateField("phone", value)}
            error={errors.phone}
          />
          <Field
            label="Instagram handle"
            id="instagramHandle"
            type="text"
            placeholder="@yourhandle"
            value={form.instagramHandle}
            onChange={(value) => updateField("instagramHandle", value)}
            error={errors.instagramHandle}
          />

          <Field
            label="Follower count (optional)"
            id="followerCount"
            type="number"
            placeholder="e.g. 12000"
            value={form.followerCount}
            onChange={(value) => updateField("followerCount", value)}
            error={errors.followerCount}
          />

          <SelectField
            label="Content category"
            id="contentCategory"
            value={form.contentCategory}
            onChange={(value) => updateField("contentCategory", value)}
            options={CONTENT_CATEGORIES}
            placeholder="Select a category"
            error={errors.contentCategory}
          />

          <Field
            label="City"
            id="city"
            type="text"
            autoComplete="address-level2"
            value={form.city}
            onChange={(value) => updateField("city", value)}
            error={errors.city}
          />
          <Field
            label="Password"
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(value) => updateField("password", value)}
            error={errors.password}
          />

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Creating account..." : "Sign up as Creator"}
          </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
          Log in
        </Link>{" "}
        &middot;{" "}
        <Link href="/signup/brand" className="font-medium text-orange-600 hover:text-orange-700">
          Sign up as a brand
        </Link>
      </p>
    </AuthShell>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field } from "../../_components/field";
import { AuthShell } from "../../_components/auth-shell";
import { Button } from "../../_components/ui/button";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBSITE_REGEX = /^\S+\.\S+$/;

interface FormState {
  name: string;
  companyName: string;
  workEmail: string;
  companyWebsite: string;
  industryCategory: string;
  city: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialFormState: FormState = {
  name: "",
  companyName: "",
  workEmail: "",
  companyWebsite: "",
  industryCategory: "",
  city: "",
  password: "",
};

export default function BrandSignupPage() {
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

    if (!form.name.trim()) nextErrors.name = "Contact name is required";
    if (!form.companyName.trim()) nextErrors.companyName = "Company name is required";
    if (!form.workEmail.trim()) {
      nextErrors.workEmail = "Work email is required";
    } else if (!EMAIL_REGEX.test(form.workEmail.trim())) {
      nextErrors.workEmail = "Enter a valid email address";
    }
    if (!form.companyWebsite.trim()) {
      nextErrors.companyWebsite = "Company website is required";
    } else if (!WEBSITE_REGEX.test(form.companyWebsite.trim())) {
      nextErrors.companyWebsite = "Enter a valid website (e.g. company.com)";
    }
    if (!form.industryCategory.trim()) nextErrors.industryCategory = "Industry category is required";
    if (!form.city.trim()) nextErrors.city = "City is required";
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
      const response = await fetch("/api/signup/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: form.workEmail,
        password: form.password,
        redirect: false,
      });

      if (!result || result.error) {
        setSubmitError("Account created, but automatic sign-in failed. Please log in.");
        setLoading(false);
        router.push("/login");
        return;
      }

      router.push("/dashboard/brand");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="For brand managers"
      title="Find authentic creators for your next campaign"
      pitch="Search and filter creators by niche, city, and audience, then manage every collaboration and payout from one dashboard."
    >
      <h1 className="text-2xl font-semibold text-strong">
        Sign up as a Brand
      </h1>
      <p className="mt-2 text-sm text-muted">
        Create your brand profile and start discovering creators.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Field
            label="Your name"
            id="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(value) => updateField("name", value)}
            error={errors.name}
          />
          <Field
            label="Company name"
            id="companyName"
            type="text"
            autoComplete="organization"
            value={form.companyName}
            onChange={(value) => updateField("companyName", value)}
            error={errors.companyName}
          />
          <Field
            label="Work email"
            id="workEmail"
            type="email"
            autoComplete="email"
            value={form.workEmail}
            onChange={(value) => updateField("workEmail", value)}
            error={errors.workEmail}
          />
          <Field
            label="Company website"
            id="companyWebsite"
            type="text"
            placeholder="company.com"
            value={form.companyWebsite}
            onChange={(value) => updateField("companyWebsite", value)}
            error={errors.companyWebsite}
          />
          <Field
            label="Industry category"
            id="industryCategory"
            type="text"
            placeholder="e.g. Fashion, Tech, Food"
            value={form.industryCategory}
            onChange={(value) => updateField("industryCategory", value)}
            error={errors.industryCategory}
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

          {submitError && <p className="text-sm text-stopped">{submitError}</p>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Creating account..." : "Sign up as Brand"}
          </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ember hover:text-ember-dark">
          Log in
        </Link>{" "}
        &middot;{" "}
        <Link href="/signup/creator" className="font-medium text-ember hover:text-ember-dark">
          Sign up as a creator
        </Link>
      </p>
    </AuthShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckboxField, Field, SelectField, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import { CONTENT_CATEGORIES } from "@/lib/content-categories";

interface FormState {
  title: string;
  description: string;
  category: string;
  city: string;
  budget: string;
  deliverables: string;
  targetAudience: string;
  deadline: string;
  negotiable: boolean;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyFormState: FormState = {
  title: "",
  description: "",
  category: "",
  city: "",
  budget: "",
  deliverables: "",
  targetAudience: "",
  deadline: "",
  negotiable: false,
};

interface CampaignFormProps {
  campaignId?: string;
  initialValues?: FormState;
}

export function CampaignForm({ campaignId, initialValues }: CampaignFormProps) {
  const router = useRouter();
  const isEditing = Boolean(campaignId);
  const [form, setForm] = useState<FormState>(initialValues ?? emptyFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.description.trim()) nextErrors.description = "Description is required";
    if (!form.category) nextErrors.category = "Select a category";
    if (!form.budget.trim()) {
      nextErrors.budget = "Budget is required";
    } else if (!(Number(form.budget) > 0)) {
      nextErrors.budget = "Budget must be a positive number";
    }
    if (!form.deliverables.trim()) nextErrors.deliverables = "Deliverables are required";
    if (!form.deadline) nextErrors.deadline = "Deadline is required";

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
      const response = await fetch(
        isEditing ? `/api/campaigns/${campaignId}` : "/api/campaigns",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            budget: Number(form.budget),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/brand/campaigns/${data.campaign.id}`);
      router.refresh();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label="Title"
          id="title"
          type="text"
          placeholder="Summer skincare launch"
          value={form.title}
          onChange={(value) => updateField("title", value)}
          error={errors.title}
        />
        <TextAreaField
          label="Description"
          id="description"
          placeholder="What's the campaign about?"
          value={form.description}
          onChange={(value) => updateField("description", value)}
          error={errors.description}
        />
        <SelectField
          label="Category"
          id="category"
          value={form.category}
          onChange={(value) => updateField("category", value)}
          options={CONTENT_CATEGORIES}
          placeholder="Select a category"
          error={errors.category}
        />
        <Field
          label="City (optional)"
          id="city"
          type="text"
          placeholder="Leave blank if location doesn't matter"
          value={form.city}
          onChange={(value) => updateField("city", value)}
        />
        <Field
          label="Budget"
          id="budget"
          type="number"
          placeholder="500"
          value={form.budget}
          onChange={(value) => updateField("budget", value)}
          error={errors.budget}
        />
        <TextAreaField
          label="Deliverables"
          id="deliverables"
          placeholder="e.g. 2 Instagram Reels + 3 Stories"
          value={form.deliverables}
          onChange={(value) => updateField("deliverables", value)}
          error={errors.deliverables}
        />
        <Field
          label="Target audience (optional)"
          id="targetAudience"
          type="text"
          placeholder="e.g. Women 18-30 interested in skincare"
          value={form.targetAudience}
          onChange={(value) => updateField("targetAudience", value)}
        />
        <Field
          label="Deadline"
          id="deadline"
          type="date"
          value={form.deadline}
          onChange={(value) => updateField("deadline", value)}
          error={errors.deadline}
        />
        <CheckboxField
          label="Open to negotiation"
          description="Let creators propose a different budget or deliverables instead of the listed terms."
          id="negotiable"
          checked={form.negotiable}
          onChange={(checked) => updateField("negotiable", checked)}
        />

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading
            ? isEditing
              ? "Resubmitting..."
              : "Publishing..."
            : isEditing
              ? "Resubmit for review"
              : "Submit for review"}
        </Button>
      </form>
    </Card>
  );
}

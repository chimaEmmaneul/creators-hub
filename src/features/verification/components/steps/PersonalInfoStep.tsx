"use client";

import { useState } from "react";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { countryFlag } from "@/lib/format";
import { personalInfoSchema, validateFields } from "@/lib/schemas";
import { ComboBox } from "@/components/ui/ComboBox";
import { MemorableDateField } from "@/components/ui/DateFields";
import { FormField, Input } from "@/components/ui/FormField";
import { useCurrentCreator } from "@/features/account/queries";
import { StepFrame } from "../StepFrame";
import type { StepProps } from "./types";

const COUNTRY_ITEMS = COUNTRY_OPTIONS.map(({ code, name }) => ({
  value: code,
  label: name,
  keywords: code,
  icon: <span aria-hidden="true">{countryFlag(code)}</span>,
}));

export function PersonalInfoStep({ frame, state, submit }: StepProps) {
  const { data: creator } = useCurrentCreator();
  const [values, setValues] = useState({
    legalName: state.legalName ?? creator?.name ?? "",
    dateOfBirth: state.dateOfBirth ?? "",
    country: state.country ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  function handleSubmit() {
    const result = validateFields(personalInfoSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return false;
    }
    submit({ step: 1, data: result.data });
    return true;
  }

  return (
    <StepFrame
      {...frame}
      title="Personal information"
      description="Enter your details exactly as they appear on your ID. Mismatches are the most common reason for a failed check."
      submitLabel="Continue"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full legal name" required error={errors.legalName} hint="Include any middle names shown on your ID." className="sm:col-span-2">
          {(control) => <Input {...control} autoComplete="name" value={values.legalName} onChange={(e) => set("legalName")(e.target.value)} />}
        </FormField>
        <MemorableDateField
          label="Date of birth"
          required
          value={values.dateOfBirth}
          onChange={set("dateOfBirth")}
          error={errors.dateOfBirth}
          description="You must be 18 or older."
        />
        <ComboBox
          label="Country of residence"
          required
          options={COUNTRY_ITEMS}
          value={values.country || null}
          onChange={(code) => set("country")(code ?? "")}
          error={errors.country}
          placeholder="Search countries"
          emptyMessage="No country matches that search"
          autoComplete="country"
        />
      </div>
    </StepFrame>
  );
}

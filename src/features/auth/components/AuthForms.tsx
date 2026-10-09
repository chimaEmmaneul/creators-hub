"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { errorMessage, isApiError } from "@/lib/api-client";
import { firstFieldErrors, loginSchema, registerSchema, validateFields } from "@/lib/schemas";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { useRegister, useSignIn } from "../hooks/use-auth";
import { PasswordField } from "./PasswordField";

function useFormErrors() {
  const formRef = useRef<HTMLFormElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);

  useEffect(() => {
    if (focusRequest) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest]);

  return {
    formRef,
    fieldErrors,
    bannerError,
    showFieldErrors: (errors: Record<string, string>) => {
      setFieldErrors(errors);
      setFocusRequest((n) => n + 1);
    },
    clearField: (field: string) => setFieldErrors((current) => ({ ...current, [field]: "" })),
    showServerError: (error: unknown) => {
      if (isApiError(error) && error.code === "VALIDATION_FAILED") {
        setFieldErrors(firstFieldErrors(error.fieldErrors));
        setFocusRequest((n) => n + 1);
      } else {
        setBannerError(errorMessage(error));
      }
    },
    clearBanner: () => setBannerError(null),
  };
}

function FormBanner({ message }: { message: string | null }) {
  return (
    <div aria-live="assertive">
      {message && (
        <p role="alert" className="flex gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}

function AuthFormShell({ formRef, onSubmit, children }: { formRef: React.RefObject<HTMLFormElement | null>; onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-5"
    >
      {children}
    </form>
  );
}

export function LoginForm({ next }: { next: string | null }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const errors = useFormErrors();
  const signIn = useSignIn(next);

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    errors.clearField(field);
  };

  function submit() {
    errors.clearBanner();
    const result = validateFields(loginSchema, values);
    if (!result.success) return errors.showFieldErrors(result.errors);
    signIn.mutate(result.data, { onError: errors.showServerError });
  }

  return (
    <AuthFormShell formRef={errors.formRef} onSubmit={submit}>
      <FormBanner message={errors.bannerError} />
      <FormField label="Email" required error={errors.fieldErrors.email}>
        {(control) => (
          <Input {...control} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={values.email} onChange={(e) => set("email")(e.target.value)} />
        )}
      </FormField>
      <PasswordField autoComplete="current-password" value={values.password} onChange={set("password")} error={errors.fieldErrors.password} />
      <Button type="submit" loading={signIn.isPending || signIn.isSuccess}>
        {signIn.isPending || signIn.isSuccess ? "Signing in…" : "Sign in"}
        {!signIn.isPending && !signIn.isSuccess && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>
      <p className="text-center text-sm text-muted">
        New to CreatorHub?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthFormShell>
  );
}

export function RegisterForm() {
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const errors = useFormErrors();
  const register = useRegister();

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    errors.clearField(field);
  };

  function submit() {
    errors.clearBanner();
    const result = validateFields(registerSchema, values);
    if (!result.success) return errors.showFieldErrors(result.errors);
    register.mutate(result.data, { onError: errors.showServerError });
  }

  const busy = register.isPending || register.isSuccess;
  return (
    <AuthFormShell formRef={errors.formRef} onSubmit={submit}>
      <FormBanner message={errors.bannerError} />
      <FormField label="Your name" required error={errors.fieldErrors.name} hint="Shown to buyers on your storefront.">
        {(control) => <Input {...control} autoComplete="name" value={values.name} onChange={(e) => set("name")(e.target.value)} />}
      </FormField>
      <FormField label="Email" required error={errors.fieldErrors.email}>
        {(control) => (
          <Input {...control} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={values.email} onChange={(e) => set("email")(e.target.value)} />
        )}
      </FormField>
      <PasswordField autoComplete="new-password" value={values.password} onChange={set("password")} error={errors.fieldErrors.password} />
      <Button type="submit" loading={busy}>
        {busy ? "Creating your account…" : "Create account"}
      </Button>
      <p className="text-center text-xs text-muted text-pretty">
        You can upload and save drafts straight away. Publishing paid content requires a quick identity check.
      </p>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthFormShell>
  );
}

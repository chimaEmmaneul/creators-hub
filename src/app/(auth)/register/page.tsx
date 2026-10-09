import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/AuthForms";
import { getCurrentCreator } from "@/server/session";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCurrentCreator()) redirect("/");
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Create your creator account</h1>
        <p className="mt-1 text-sm text-muted">Start uploading in under a minute.</p>
      </div>
      <RegisterForm />
    </div>
  );
}

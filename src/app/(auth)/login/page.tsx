import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DemoAccounts } from "@/features/auth/components/DemoAccounts";
import { LoginForm } from "@/features/auth/components/AuthForms";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getCurrentCreator } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeRedirectPath(next) : null;
  if (await getCurrentCreator()) redirect(nextPath ?? "/");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage your videos and earnings.</p>
      </div>
      <LoginForm next={nextPath} />
      <DemoAccounts next={nextPath} />
    </div>
  );
}

"use client";

import { FlaskConical, LogIn } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api-client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { Button } from "@/components/ui/Button";
import { useSignIn } from "../hooks/use-auth";

export function DemoAccounts({ next }: { next: string | null }) {
  const signIn = useSignIn(next);
  const pendingEmail = signIn.isPending || signIn.isSuccess ? signIn.variables?.email : undefined;

  return (
    <section aria-labelledby="demo-accounts-heading" className="rounded-xl border border-dashed border-line-strong p-4">
      <h2 id="demo-accounts-heading" className="flex items-center gap-2 text-sm font-semibold text-fg">
        <FlaskConical className="size-4 text-accent" aria-hidden="true" />
        Demo accounts
      </h2>
      <p className="mt-1 text-xs text-muted">
        For reviewers. Password for both: <code className="rounded bg-subtle px-1 py-0.5 font-mono text-fg">{DEMO_PASSWORD}</code>
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{account.name}</p>
              <p className="truncate text-xs text-muted">{account.description}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={pendingEmail === account.email}
              disabled={Boolean(pendingEmail)}
              aria-label={`Sign in as ${account.name}`}
              onClick={() =>
                signIn.mutate(
                  { email: account.email, password: DEMO_PASSWORD },
                  { onError: (error) => toast.error(errorMessage(error)) },
                )
              }
            >
              {pendingEmail !== account.email && <LogIn className="size-4" aria-hidden="true" />}
              Sign in
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

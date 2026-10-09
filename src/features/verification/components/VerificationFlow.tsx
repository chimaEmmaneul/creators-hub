"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, IdCard, Lock, Rocket, ScanFace, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { errorMessage } from "@/lib/api-client";
import type { RejectionReason, VerificationState } from "@/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QueryView } from "@/components/ui/QueryView";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useVerification } from "../hooks/use-verification";
import { Stepper } from "./Stepper";
import { IdentityDocumentStep } from "./steps/IdentityDocumentStep";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { ReviewStep } from "./steps/ReviewStep";
import { SelfieStep } from "./steps/SelfieStep";
import type { StepProps } from "./steps/types";

const STEP_LABELS = ["Personal info", "ID document", "Selfie", "Review"] as const;
const TOTAL_STEPS = STEP_LABELS.length;
const REVIEW_STEP = 4;

const REJECTION_FIXES: Record<RejectionReason, { title: string; body: string; step: number }> = {
  DOCUMENT_UNREADABLE: {
    title: "We couldn't read your ID photo",
    body: "Parts of the document were too blurry or covered by glare. Retake the photo in good light; everything else you entered is saved.",
    step: 2,
  },
};

export function VerificationFlow() {
  const { query, submitStep } = useVerification();
  return (
    <QueryView
      query={query}
      errorTitle="We couldn't load your verification"
      skeleton={
        <LoadingRegion label="Loading verification">
          <Skeleton className="h-96 rounded-xl" />
        </LoadingRegion>
      }
    >
      {(state) => {
        if (state.status === "VERIFIED") return <VerifiedPanel />;
        if (state.status === "PENDING") return <InReviewPanel state={state} />;
        return <Wizard state={state} submitStep={submitStep} />;
      }}
    </QueryView>
  );
}

function Wizard({ state, submitStep }: { state: VerificationState; submitStep: ReturnType<typeof useVerification>["submitStep"] }) {
  const rejection = state.status === "REJECTED" && state.rejectionReason ? REJECTION_FIXES[state.rejectionReason] : null;
  const [started, setStarted] = useState(state.completedStep > 0 || Boolean(rejection));
  const [step, setStep] = useState(rejection?.step ?? Math.min(state.completedStep + 1, TOTAL_STEPS));
  const [navigated, setNavigated] = useState(false);

  if (!started) return <Intro onStart={() => setStarted(true)} />;

  const goTo = (next: number) => {
    submitStep.reset();
    setNavigated(true);
    setStep(next);
  };

  const nextStepAfter = (current: number) => (rejection && state.completedStep >= REVIEW_STEP - 1 ? REVIEW_STEP : current + 1);

  const props: StepProps = {
    state,
    submit: (input) => submitStep.mutate(input, { onSuccess: () => input.step < TOTAL_STEPS && goTo(nextStepAfter(input.step)) }),
    frame: {
      step,
      totalSteps: TOTAL_STEPS,
      pending: submitStep.isPending,
      error: submitStep.isError ? errorMessage(submitStep.error) : null,
      focusOnMount: navigated,
      onBack: step > 1 ? () => goTo(step - 1) : undefined,
    },
  };

  return (
    <div className="flex flex-col gap-6">
      {rejection && (
        <div role="alert" className="flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="font-semibold text-fg">{rejection.title}</p>
            <p className="mt-0.5 text-sm text-muted">{rejection.body}</p>
          </div>
        </div>
      )}
      <Stepper steps={STEP_LABELS} current={step} completed={state.completedStep} onSelect={goTo} />
      <p className="sr-only" aria-live="polite">
        Step {step} of {TOTAL_STEPS}: {STEP_LABELS[step - 1]}
      </p>
      <Card className="p-4 sm:p-6">
        {step === 1 && <PersonalInfoStep key={1} {...props} />}
        {step === 2 && <IdentityDocumentStep key={2} {...props} />}
        {step === 3 && <SelfieStep key={3} {...props} />}
        {step === 4 && <ReviewStep key={4} {...props} onEditStep={goTo} />}
      </Card>
    </div>
  );
}

const NEEDS: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: UserRound, title: "Your legal name and date of birth", detail: "Exactly as shown on your ID" },
  { icon: IdCard, title: "A valid photo ID", detail: "Passport, driver's license or national ID card" },
  { icon: ScanFace, title: "A quick selfie", detail: "Your phone or laptop camera works, or upload a photo" },
];

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-6 p-5 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-soft-fg" aria-hidden="true">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-fg">Get verified to start earning</h2>
            <p className="mt-1 text-sm text-muted text-pretty">
              Verification keeps buyers safe and makes sure payouts reach the right person. It takes <strong className="text-fg">about 3 minutes</strong>, and
              your progress is saved after each step.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fg">You&apos;ll need</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {NEEDS.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex gap-3 rounded-xl bg-subtle p-3 sm:flex-col sm:gap-2">
                <Icon className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-fg">{title}</p>
                  <p className="text-xs text-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex gap-2 text-xs text-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Your documents are used only to verify your identity. In this demo, photos never leave your device; only a file name is saved.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line bg-subtle/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <ButtonLink href="/" variant="ghost">
          Not now
        </ButtonLink>
        <Button onClick={onStart}>Start verification</Button>
      </div>
    </Card>
  );
}

function InReviewPanel({ state }: { state: VerificationState }) {
  const steps = [
    { label: "Details submitted", done: true },
    { label: "Automated checks", done: true },
    { label: "Final review", done: false },
  ];
  return (
    <Card className="p-5 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-warning-soft text-warning" aria-hidden="true">
          <Clock3 className="size-6" />
        </span>
        <h2 className="text-xl font-semibold text-fg">Verification submitted</h2>
        <p className="mt-1 max-w-md text-sm text-muted text-pretty">
          Thanks! Reviews usually take a few seconds in this demo (a few minutes in production). This page updates by itself, and there&apos;s no
          need to resubmit.
        </p>
      </div>
      <ol className="mx-auto mt-6 flex max-w-xs flex-col gap-3" aria-label="Review progress">
        {steps.map(({ label, done }) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            {done ? (
              <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            ) : (
              <Spinner className="size-5 text-warning" />
            )}
            <span className={clsx(done ? "text-fg" : "font-medium text-fg")}>
              {label}
              <span className="sr-only">{done ? ", complete" : ", in progress"}</span>
            </span>
          </li>
        ))}
      </ol>
      {state.idQualityWarning && (
        <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted">
          You kept an ID photo that didn&apos;t pass our quality check, so the reviewer may ask for a clearer one.
        </p>
      )}
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/" variant="secondary">
          Keep working on drafts
        </ButtonLink>
      </div>
    </Card>
  );
}

function VerifiedPanel() {
  return (
    <Card>
      <div role="status" className="flex flex-col items-center px-6 py-12 text-center animate-scale-in">
        <span className="mb-4 grid size-14 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold text-fg">You&apos;re verified</h2>
        <p className="mt-1 max-w-sm text-sm text-muted text-pretty">Publishing is unlocked. Your drafts are ready to go live whenever you are.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/">Go to my content</ButtonLink>
          <ButtonLink href="/content/new" variant="secondary">
            <Rocket className="size-4" aria-hidden="true" />
            Upload a video
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

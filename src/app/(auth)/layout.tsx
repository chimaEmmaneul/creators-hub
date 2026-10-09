import type { ReactNode } from "react";
import { BadgeDollarSign, Clapperboard, ShieldCheck, UploadCloud } from "lucide-react";

const HIGHLIGHTS = [
  { icon: UploadCloud, text: "Upload videos of any size, with resumable uploads" },
  { icon: BadgeDollarSign, text: "Set your own price and get paid for every purchase" },
  { icon: ShieldCheck, text: "Paid content is protected with expiring, signed links" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-accent p-12 text-on-accent lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-20 size-96 rounded-full bg-black/10 blur-3xl" />
        <p className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-white/15">
            <Clapperboard className="size-5" aria-hidden="true" />
          </span>
          CreatorHub Studio
        </p>
        <div className="relative max-w-md">
          <p className="text-4xl font-semibold tracking-tight text-balance">Turn what you know into income.</p>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-on-accent/90">
                <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-on-accent/70">A fictional platform built for an engineering assessment.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <p className="mb-8 flex items-center gap-2.5 font-semibold text-fg lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent">
              <Clapperboard className="size-4.5" aria-hidden="true" />
            </span>
            CreatorHub Studio
          </p>
          {children}
        </div>
      </main>
    </div>
  );
}

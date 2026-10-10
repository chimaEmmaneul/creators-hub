# AI Usage

## Which AI tools did I use?

- **Claude Code** (Anthropic), in the VS Code extension. It was the
  primary tool: it read the brief and the codebase, planned, wrote code, ran
  the build and tests, and drove a headless browser to check the UI.
- No other AI tools.

## What did I use them for?

- **Gap analysis**: comparing the brief, page by page, with my first
  version and producing a prioritized plan.
- **Implementation**:
  - restructuring into a server layer, domain errors and shared schemas;
  - the UI primitives (dialog, form field, radio cards);
  - the dashboard, content and purchases features (I built verification
    myself; see the last section).
- **Research**: current guidance on accessible modals, responsive
  tables, and loading, empty and error states. The decisions that came out
  of it are listed in the README's Accessibility section.
- **Verification**: running type checks, lint, unit tests and a production
  build, plus Playwright scripts that clicked through every key flow at
  mobile size and took screenshots for review.
- **Drafting docs**: the architecture document and README. I then reviewed
  and edited them (see below).

## Where did AI save the most time?

- **Accessible UI building blocks.** The dialog's focus handling, the form
  field wiring (labels, hints and errors linked for screen readers), and
  the React Aria dropdowns. Getting these right by hand involves many
  small details.
- **End-to-end checks.** Scripted browser runs at phone size replaced
  hours of manual clicking. They caught real problems I'd have shipped:
  a truncated dropdown, a filter overflowing on mobile, and a Mermaid
  diagram that wouldn't render properly on GitHub.

## One example where AI output was rejected, corrected or significantly changed

- **Prisma 7 configuration.** The first AI-generated setup paired Prisma 7
  with a Prisma 5/6-style schema (`url = env(...)` in the datasource). The
  setup steps in the README could never have worked. It was caught by
  actually running `prisma validate`, and fixed by pinning Prisma 6 rather
  than adopting Prisma 7's driver-adapter config, which was more change
  than the exercise needed.
- **Outdated framework API.** The original error boundary used `reset`.
  Next.js 16 renamed the recovery callback to `retry` (`reset` now only
  re-renders without re-fetching). This was caught by reading the docs
  bundled in `node_modules/next/dist/docs` instead of trusting memory.

## How did I verify AI-generated code?

- `npm run typecheck`, `npm run lint` (including jsx-a11y and React
  Compiler rules) and `npm run build` on every change.
- **Unit tests** for the publishing rule on every path that can make
  content public, the verification order and review, and the library
  filtering logic.
- **API checks with curl**: 403 for unverified publishing, 404 for another
  creator's content, 422 for validation, 400 for malformed JSON, 409 for
  skipping a verification step.
- **Browser checks** (Playwright, 390px viewport, fake camera device):
  sign-in redirect with `next`, demo sign-in, the searchable country
  picker, date-of-birth segments, camera and upload capture, quality
  warning, rejection → fix only the document → approval, theme
  persistence, registration validation, and the schedule picker. Earlier
  rounds covered: blocked publish → dialog;
  upload → "Publish now" → server refusal → save as draft; empty submit
  moves focus to the first invalid field; full verification → automatic
  approval → publish succeeds; delete dialog focuses Cancel. Screenshots at
  desktop and mobile sizes, in both light and dark themes.
- **My own review of every change:**
  1. First, I check that I understand the change it's making.
  2. Then I test it critically against the case the change was made
     for. For example, I asked for a YouTube-style video player, then
     checked that it worked exactly as I described, with every feature
     I wanted.
  3. Finally, I run the type check myself, to catch TypeScript errors
     and make sure the new change hasn't broken what worked before.

## What did I deliberately do myself, and why?

**The identity verification flow** (`features/verification/*`, `server/verification.ts`).

I chose to build it myself because verification is where creator platforms lose the most people, so it needed the most care.

- Flow and state: four steps (personal info → ID document → selfie → review), saved on each Continue so creators can finish later and resume. The server enforces the step order, so a step can't be skipped by calling the API directly.

- User-friendliness: an intro screen that sets expectations; date of birth as typed day/month/year fields instead of a calendar; a searchable country list; the legal name prefilled; on-device photo checks for darkness, glare and blur, each with a specific fix; a rejection reopens only the step that failed.

- Accessibility: the stepper uses aria-current="step"; step changes and photo-check results are announced to screen readers; focus moves to each new step's heading; upload is always an alternative to the camera.

- Authentication before upload. Signed-out users are redirected to sign in before they can reach the upload page (proxy.ts), and every page and API call checks the session in the database (requireCreator() / requireApiCreator()). So an upload is always tied to a real, signed-in creator.

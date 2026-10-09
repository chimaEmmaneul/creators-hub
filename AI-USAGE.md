# AI Usage

## Which AI tools did I use?

- **Claude Code** (Anthropic), in the VS Code extension. It was the
  primary tool: it read the brief and the codebase, planned, wrote code, ran
  the build and tests, and drove a headless browser to check the UI.
- <!-- TODO(you): list anything else you used (ChatGPT, Copilot, …), or delete this line. -->

## What did I use them for?

- **Gap analysis**: comparing the brief, page by page, with my first
  version and producing a prioritized plan.
- **Implementation**:
  - restructuring into a server layer, domain errors and shared schemas;
  - the UI primitives (dialog, form field, radio cards);
  - the dashboard, content, purchases and verification features.
- **Research**: current guidance on accessible modals, steppers, responsive
  tables, and loading, empty and error states. The decisions that came out
  of it are listed in the README's Accessibility section.
- **Verification**: running type checks, lint, unit tests and a production
  build, plus Playwright scripts that clicked through every key flow at
  mobile size and took screenshots for review.
- **Drafting docs**: the architecture document and README. I then reviewed
  and edited them (see below).

## Where did AI save the most time?

<!-- TODO(you): check this matches your experience and edit freely. -->
- **Accessible UI building blocks.** The dialog's focus handling, the form
  field wiring (labels, hints and errors linked for screen readers), and
  the React Aria dropdowns, combobox and date pickers. Getting these right
  by hand involves many small details.
- **End-to-end checks.** Scripted browser runs at phone size, with a
  simulated camera, replaced hours of manual clicking. They caught real
  problems I'd have shipped: a truncated dropdown, a filter overflowing on
  mobile, and a Mermaid diagram that wouldn't render properly on GitHub.
- **Research synthesis.** Turning identity-verification UX guidance into
  concrete design decisions (intro screen, on-device photo checks,
  fix-only-what-failed rejections).

## One example where AI output was rejected, corrected or significantly changed

<!-- TODO(you): keep the one or two you can explain best, in your own words. -->

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
- **Searchable country field showed hidden keywords.** The first combobox
  put country codes into each option's `textValue` so "NG" would find
  Nigeria. React Aria writes `textValue` into the input on selection, so
  the field would have shown "Nigeria NG". Fixed with a custom filter that
  searches label + keywords while displaying only the label.
- **Toasts lost after navigation.** Delete toasts were first placed in
  `mutate()` callbacks. TanStack Query doesn't run those once the calling
  component unmounts, and deleting from the detail page navigates away
  immediately, so the success message would never appear. They moved to
  the mutation-level callbacks.
- **Quality check too strict.** The first brightness ceiling (215) flagged
  ordinary light-coloured ID cards as "washed out". This was caught in an
  end-to-end run with a synthetic card image, and raised to 235, with glare
  detection still catching blown-out patches.
- **Video sizes overflowed the database.** Seeding failed because 2–5 GB
  file sizes don't fit a 32-bit `Int`. The column became `BigInt`, converted
  to a number at the DTO boundary.

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
- **Reading every file before accepting it.**
  <!-- TODO(you): describe your own review pass, e.g. running the app yourself on desktop and phone, and asking for an explanation of anything you couldn't explain back. -->

## What did I deliberately do myself, and why?

<!-- TODO(you): keep only the items you actually did, and say why in your own words. -->
- **The git history.** Commits in logical stages, so the history shows how
  the project came together.
- **The out-of-order verification test.** Writing it myself proves I
  understand the state machine that guards verification.
- **Search on Recent Purchases.** A full-stack change through schema,
  service, API and UI, done by hand.
- **Tuning the photo quality thresholds** with real ID photos. These are
  judgement calls about false alarms against missed problems, so they
  should be mine.
- **Re-checking the cost estimate** against current price pages. The
  numbers in a design review should be numbers I can defend.
- **Keyboard and VoiceOver testing.** Automated checks can't tell me
  whether the experience actually makes sense to a person.

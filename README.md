# CreatorHub Studio: Creator Portal

The first version of the CreatorHub creator portal. Creators sign in,
track revenue and sales, upload and manage paid videos, and complete
identity verification, which unlocks publishing.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 + SQLite · TanStack Query · React Aria Components · Zod · Recharts · next-themes · Vitest
- **Video platform design** (upload → processing → storage → delivery → playback, diagrams, scale and cost estimate): [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **AI usage:** [`AI-USAGE.md`](AI-USAGE.md)

![CreatorHub video architecture](docs/architecture.png)

<sub>Editable source: [`docs/architecture.drawio`](docs/architecture.drawio) (open in draw.io). Mermaid version and the paid-playback sequence: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).</sub>

### Where each part of the brief is answered

| Brief section | Answered in |
|---|---|
| 2. Completed / remains / next priority and why | [Project status](#project-status) |
| 3. Technology and choices | [Technology choices](#technology-choices) |
| 4. Creator dashboard | [What's implemented](#whats-implemented) |
| 5. Create and publish content | [What's implemented](#whats-implemented) |
| 6. Account verification, unverified publish UX | [The verification flow](#the-verification-flow) |
| 7. Real-world states, mobile | [UI states](#ui-states), [Accessibility](#accessibility) |
| 8A–F. Upload, processing, storage, delivery, protection, cost (incl. "Should large files pass through the app server?" and "5 views vs 500,000 views") | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) sections A–F |
| 9. Architecture diagram | Image above, [`docs/architecture.drawio`](docs/architecture.drawio), Mermaid in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| 10. Scale and cost challenge, monthly estimate, largest cost | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), "Scale and cost challenge" |
| 11. Product challenge | [Product challenge](#product-challenge-three-recommendations) |
| 12. Architecture, scale, security, performance, reliability, observability, next steps | [Architecture](#architecture), [Engineering judgment](#engineering-judgment) |
| 13. AI usage | [`AI-USAGE.md`](AI-USAGE.md) |
| 14. Setup, demo controls, assumptions, limitations, time, tests, seed data, reset, persistence | [Quick start](#quick-start), [Demo accounts](#demo-accounts), [Assumptions and limitations](#assumptions-and-limitations), [Time spent](#time-spent) |

---

## Project status

**Completed:** every feature in Parts 1–7, plus authentication, theming and
a redesigned verification flow; the written design for Parts 5, 8, 9 and
10; the product challenge; and the AI usage notes.

**What remains, in priority order, and why:**

| Priority | Item | Why it comes first |
|---|---|---|
| 1 | Real uploads to object storage (presigned multipart) | Upload is the core creator job and the biggest gap between the demo and production. Everything downstream (processing, playback) depends on it. |
| 2 | Earnings and payouts view | Money is why creators are here; "when do I get paid?" is the question totals don't answer. |
| 3 | Screen-reader audit, plus Playwright tests in CI | The flows are tested by script, but not yet with VoiceOver or NVDA, and CI should stop regressions in the publish gate and verification. |
| 4 | Email verification and password reset | Needed before real accounts hold real money. |
| 5 | Server-side library pagination | Only matters once creators have hundreds of videos; purchases already paginate on the server. |

---

## Technology choices

| Choice | Why | Trade-off |
|---|---|---|
| **Next.js App Router** (required) | Server components let pages load data directly from the service layer; route handlers give the brief's backend endpoint in the same project. | A newer mental model (server/client boundary), and v16 renamed several APIs. |
| **Prisma + SQLite** | A real relational schema and migrations with zero setup for reviewers; switching to Postgres is a one-line provider change. | SQLite has a single writer; fine for a demo, not for production. |
| **TanStack Query** | Caching, background refetch, retry with backoff, optimistic updates and invalidation, with server prefetch + hydration so the first paint still has data. | One more concept; it's used deliberately for all client reads and writes rather than mixed with ad-hoc fetches. |
| **React Aria Components** | Accessible select, combobox, date picker and calendar (keyboard, screen readers, i18n), unstyled so they match the design. | Larger than native inputs, but native date and select controls can't be styled or searched. |
| **Zod** | One set of rules validates forms in the browser and requests on the server. | None significant. |
| **Own session auth** (scrypt + hashed DB sessions) | No extra dependency, instant revocation, and every security decision is visible and explainable. | Missing extras a library would bring (OAuth, password reset); listed in Project status. |
| **Tailwind v4 with design tokens** | Semantic colour tokens give light and dark themes from one block. | Long class strings, kept manageable with small shared components. |
| **Vitest** | Fast unit tests against a throwaway SQLite database. | No browser tests in CI yet (checked with Playwright scripts locally). |

---

## Quick start

Requires Node 20+.

```bash
npm install        # also generates the Prisma client
npm run setup      # creates prisma/dev.db and seeds demo data
npm run dev        # http://localhost:3000, which redirects to /login
```

| Command | What it does |
|---|---|
| `npm test` | Vitest suite: publishing rule, auth (hashing, sessions, rate limiting), verification (ordering, rejection, resubmission), photo quality checks, library query logic. Uses a separate `prisma/test.db`. |
| `npm run lint` / `npm run typecheck` | ESLint (including jsx-a11y and React Compiler rules) / TypeScript |
| `npm run db:reset` | Drops and recreates the database, then re-seeds it |
| `npm run build && npm start` | Production build |

## Demo accounts

Both accounts use the password **`creatorhub-demo-2026`**. The login page
also has one-click **Sign in** buttons for them.

| Account | State |
|---|---|
| `amara@example.com` | Verified. 12 videos (published, scheduled, draft) and 40 purchases across every status. |
| `jordan@example.com` | Not verified. Drafts only and no sales: the publish gate, verification and empty states. |

You can also **create your own account** at `/register`. New accounts
start unverified with an empty library.

**Reset demo data** is in the account menu (click your name in the sidebar,
or your avatar on mobile). It restores the seed and signs everyone out.

| To see | Do this |
|---|---|
| **Auth gate** | Open any page while signed out: you're redirected to `/login?next=…` and returned there after signing in. |
| **Publish gate** | As Jordan, press **Publish** on a draft, or upload a video with "Publish now". The server returns `403 NOT_VERIFIED`; a dialog offers "Save as draft" or "Save draft & verify". |
| **Verification, approved** | As Jordan, open **Verify** and complete the steps with clear photos (camera or upload). About 6 seconds after you submit, the review approves and the page, banner and account badge update by themselves. |
| **Verification, rejected and fixed** | Upload a **dark or blurry** ID photo, choose "Use this photo anyway", and submit. The review rejects it with a specific reason; the wizard reopens at **only** the document step, then jumps straight back to review. |
| **Upload failure and resume** | Upload a video whose file name contains `fail`. It stops at about 60%; **Resume upload** continues from the last part. |
| **Error and retry** | Stop the server, then change the purchases page: automatic retries, then **Try again**. Go offline in DevTools for the offline banner. |
| **Theming** | Account menu → Light / Dark / System. Saved per browser, with no flash of the wrong theme on reload. |

**Publish gate via curl:**
```bash
curl -c jar -H 'Content-Type: application/json' \
  -d '{"email":"jordan@example.com","password":"creatorhub-demo-2026"}' localhost:3000/api/auth/login
ID=$(curl -s -b jar localhost:3000/api/content | node -pe 'JSON.parse(require("fs").readFileSync(0)).items[0].id')
curl -i -b jar -X POST localhost:3000/api/content/$ID/publish     # 403 NOT_VERIFIED
```

**Persistence.** SQLite at `prisma/dev.db`. Data **survives page refreshes
and server restarts**; only `npm run db:reset` or **Reset demo data**
restore the seed. The seed is deterministic (seeded random numbers, dates
relative to today), so every reset looks the same and recent.

**Seed data:**
- 2 creators;
- 14 content items: Published, Scheduled and Draft;
- 40 purchases: Completed, Pending, Refunded and Failed, from 12 countries.

---

## What's implemented

| Brief | Where |
|---|---|
| Creator registration and sign-in (email + password, server-side sessions) | `features/auth`, `server/auth/*`, `server/session.ts`, `src/proxy.ts` |
| Overview: total revenue, revenue this month (with month-on-month change), total content, total purchases | `features/dashboard/components/OverviewStats.tsx` |
| Revenue or purchases over 30 days (zero-filled days, accessible data table) | `features/dashboard/components/PerformanceChart.tsx` |
| Content: thumbnail, title, price, views, purchases, revenue, status (Published / Scheduled / Draft); actions View, Edit, Publish, Delete | `features/content/*`, `/content/[id]`, `/content/[id]/edit` |
| Library: **search, status filter, sort, pagination** | `features/content/lib/library-query.ts` |
| Recent purchases: date, content, amount, country, status, with **server-side filter, sort and pagination** | `features/purchases/*`, `GET /api/purchases` |
| Create and publish content: title, description, price, thumbnail, video, status (Draft / Publish now / Schedule); validation, upload progress, errors, success feedback | `features/content/components/form/*` |
| **Backend-enforced publishing rule** | `server/publishing-policy.ts`, applied to create, edit, publish and scheduled release |
| Verification: personal info → ID type and document (front/back) → selfie → review; in-review, rejected and verified states | `features/verification/*`, `server/verification.ts` |
| Loading, empty, error, retry, validation, success and destructive-confirmation states; desktop, tablet and mobile | throughout; see below |

### The verification flow

Verification is where creator platforms lose people, so I researched it
first; sources are at the end. What came out of that research:

| Research finding | What the flow does |
|---|---|
| Show the step count and time up front; explain why sensitive data is needed | An **intro screen** lists what you'll need, says it takes about 3 minutes, explains why (payouts, buyer trust) and how photos are handled. Nothing is asked for until "Start". |
| Don't fire the camera permission prompt unannounced | The camera starts only when the creator taps **Turn on camera**. Denied, missing or failed cameras each get a clear message and an **upload** fallback. |
| Re-uploading after a failed review is the biggest drop-off point | **On-device quality checks** (brightness, glare, sharpness via variance of the Laplacian) run the moment a photo is taken, each with a specific fix ("Too dark. Move somewhere brighter."). **Use this photo anyway** is always allowed, so a false alarm never blocks anyone. |
| Guide the capture | A live viewfinder with a **card-shaped frame** (rear camera) or an **oval** with a 3-second countdown (front camera, mirrored), with framing instructions on screen. |
| Specific rejection reasons; fix only what failed | A rejection says what was wrong and reopens **only** the step that fixes it. Everything else is kept, and the flow goes straight back to review. |
| Separate "in review" from "rejected"; prevent duplicate submissions | An in-review timeline updates itself (polling), with "no need to resubmit". |
| Save progress | Each step saves on Continue; **Finish later** is always available, and returning creators resume where they left off. |
| Memorable dates shouldn't use calendars (GOV.UK pattern) | Date of birth uses **typed day/month/year segments** in the viewer's locale order, not a calendar. |
| Fewer fields, fewer mismatches | The legal name is **prefilled** from the account; the country is a **searchable** list of every ISO country, with flags and accent-insensitive search. Driver's licenses and national IDs ask for both sides; passports only the photo page. |

### Product decisions beyond the brief

- **Upload starts when the file is picked**, so the creator fills in
  details while it runs (product recommendation #1, implemented).
- **Scheduling counts as publishing**, so it needs verification too; the
  policy is checked again when scheduled items go live.
- **Delete is a soft delete**, so buyers' purchase history and earnings
  survive.
- **Blocked publishing never loses work**: "Save draft & verify".
- **Another creator's content returns 404, not 403**, so content ids can't
  be probed for existence.

---

## Architecture

```
src/
├── proxy.ts             Optimistic auth redirect (cookie present?), no database access
├── app/
│   ├── (auth)/          /login, /register: split-screen layout, no app shell
│   ├── (studio)/        Signed-in pages; the layout calls requireCreator() and prefetches the creator
│   └── api/             Route handlers; _lib/handle-route.ts maps domain errors to HTTP
├── server/              Business logic and data access (framework-agnostic, unit-tested)
│   ├── auth/            scrypt passwords, hashed session tokens, rate limiter, accounts
│   ├── session.ts       The only module that reads/writes the session cookie
│   ├── publishing-policy.ts   The single home of "unverified can't publish"
│   ├── prefetch.ts      Server-side query definitions, using the same keys as the client
│   └── content / purchases / analytics / verification / mappers
├── features/<domain>/   api.ts (fetchers) · queries.ts (React Query options) · hooks · components
├── components/ui/       Accessible primitives: Select, ComboBox, date fields, Dialog, FormField, …
├── components/layout/   App shell, navigation, account menu, theme toggle, banners
└── lib/                 Zod schemas, API contract and client, query keys and client, formatting
```

**Why this shape:**

- **Data flow: server prefetch, then React Query.**
  - Each page prefetches its queries in parallel, straight from the service
    layer with no HTTP round trip, and dehydrates them into a
    `<HydrationBoundary>`. The first paint has all the data.
  - From then on, client components read with `useQuery` against the same
    keys (`lib/query/keys.ts`), so the browser cache, background refetch,
    retry and invalidation all apply.
  - Writes are mutations: publish and delete update optimistically and roll
    back on error, and every write invalidates the content and dashboard
    queries.
  - Publishing is optimistic **only** for verified creators; otherwise the
    server will refuse, and showing "Published" first would be a lie.
- **Auth is layered.** `proxy.ts` redirects requests without a cookie
  before anything renders. `requireCreator()` / `requireApiCreator()` check
  the session in the database on every page and API call. Services take
  the acting creator as an argument and never read cookies.
- **The rule the brief cares about lives in one file.** Every path that
  makes content public calls `assertCanPublish`, and each path is tested.
- **One contract on both sides.** The same Zod schemas validate in the
  browser and on the server. The error envelope `{ error: { code,
  message, fieldErrors } }` is typed once and produced in one place.
- **Accessible primitives instead of per-feature markup.** Custom
  dropdowns, comboboxes and date pickers are built on React Aria, which
  handles keyboard, screen-reader, focus and internationalisation
  behaviour. The app's code only styles them.
- **Theming with tokens.** Colours are semantic CSS variables switched by
  `data-theme` (next-themes), applied before first paint.

### UI states

| State | Implementation |
|---|---|
| Loading | Skeletons that mirror the real layout. The purchases table keeps the current page visible (dimmed) while the next loads. Buttons show spinners and `aria-busy`. |
| Empty | Every list and the chart explain why they're empty and offer one next step; "no results" is a separate state with "Clear filters". |
| Error | `QueryView` shows an error panel with **Try again** (progress shown while retrying). Route boundaries use Next 16's `retry()`; `global-error.tsx` covers the root. Forms keep the user's input. |
| Retry | Network and 5xx errors retry automatically with backoff, then manually. Uploads resume from the last part. Next's `useOffline` retries navigations; a banner explains the wait. |
| Validation | Shared Zod rules, inline and announced; focus moves to the first invalid field. |
| Success | Toasts (polite live region, following the theme) plus navigation to the result. |
| Destructive | Native `<dialog>` confirmation with focus starting on **Cancel**. |

### Accessibility

- **Structure:** landmarks, a skip link, one `h1` per page, `aria-current`
  in navigation, table captions and header scopes.
- **Controls:**
  - Dropdowns, comboboxes, date fields, the calendar and the theme switch
    are React Aria components, with full keyboard support (arrows,
    typeahead, Home/End, Escape) and correct ARIA roles.
  - Dialogs use native `<dialog>`, with focus containment and focus
    returned to the trigger.
  - Choice cards are native radio groups.
- **Forms:** labels, hints and errors are linked via `aria-describedby` and
  `aria-invalid`, and errors are announced. Passwords have a show/hide
  toggle (`aria-pressed`) and a live requirements checklist.
- **Verification:**
  - the stepper is an ordered list with `aria-current="step"`, and step
    changes are announced, with focus moving to the step heading;
  - capture state, quality results and the selfie countdown are announced
    through a live region;
  - the camera is never the only option: upload is always available.
- **Perception:**
  - status always pairs colour with an icon and text;
  - WCAG AA contrast in both themes;
  - the chart colour was validated for each theme;
  - `prefers-reduced-motion` is respected.
- **Mobile:**
  - 44px touch targets;
  - 16px inputs, so iOS doesn't zoom;
  - a bottom tab bar;
  - tables become cards below `md`;
  - the camera chooses the rear or front lens as appropriate.

Checked with `eslint-plugin-jsx-a11y` and scripted Playwright runs of
every key flow at 390px wide (including a fake camera). A manual
screen-reader audit is still on the next-steps list.

---

## Engineering judgment

**Security (implemented):**
- Passwords hashed with scrypt, using a per-password salt and parameters
  stored with the hash.
- Session tokens are 256-bit random values stored only as SHA-256 hashes,
  so they can be revoked instantly.
- Cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
- Login and registration are rate limited; login answers with one generic
  error, and unknown emails take as long as wrong passwords, so emails
  can't be enumerated.
- `next` redirects are restricted to the same site (no open redirect).
- Every query is scoped to the acting creator.

**Security (before production):**
- the rate limiter in Redis (it's per-instance in memory today);
- CSRF tokens on mutations, in addition to `sameSite`;
- email verification and password reset;
- a strict Content Security Policy;
- a real identity vendor, with personal data encrypted at rest and
  retention limits;
- presigned uploads with server-side content sniffing and malware scanning;
- signed playback tokens;
- audit logs;
- dependency scanning.

**Scale (millions of users).**
- Postgres with read replicas.
- Pre-aggregated dashboard metrics (daily rollups or an OLAP store).
- Server-side pagination for the library, as purchases already have.
- Redis for sessions, entitlements and rate limits.
- Scheduled releases and view counts moved to queues and cron jobs.
- The video side is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

**Frontend performance.**
- Server-rendered first paint from the prefetched cache.
- `staleTime` stops hydrated data from being refetched immediately.
- Per-query caching makes revisits instant.
- Client JavaScript only where interaction needs it.
- `next/image` for thumbnails.
- Next: a bundle budget in CI, real-user Core Web Vitals, and lazy-loading
  the chart and capture code.

**Reliability: when something fails.**

| Failure | Behaviour |
|---|---|
| Upload interrupted | Multipart parts are kept; the client resumes from the last completed part (simulated here). Incomplete uploads expire after 7 days. |
| Processing fails | Retries with backoff, then a dead-letter queue. The creator sees `FAILED` and "Retry processing"; the original is kept. |
| CDN unavailable | Multi-CDN failover via DNS health checks, plus a fallback host in the player. |
| API unavailable | Cached data stays on screen, with automatic and then manual retry. Forms keep their input. An offline banner explains connectivity problems. |
| Payment succeeds but video authorization fails | The payment webhook is the source of truth and grants the entitlement idempotently. The player retries token issuance; if it still fails, the viewer sees "Purchase confirmed, preparing access", reconciliation repairs it, and support is alerted. |

**Observability.**
- Structured logs with request IDs and error digests.
- Error tracking on client and server.
- Golden signals per route.
- Funnels: sign-up → verified → first publish; verification drop-off per
  step, quality-warning rate and rejection rate; upload → ready →
  published; purchase → playback.
- Video quality of experience.
- Alerts on queue age, cache hit ratio, login failure spikes and token
  rejections.

**Next steps (another week on the product).** I'd start with real
presigned multipart uploads to object storage: upload is the core creator
job, and processing and playback depend on it. Then the earnings and
payouts view, because payouts are why creators use the platform. The full
ordered list, with reasons, is in [Project status](#project-status).

---

## Product challenge: three recommendations

| # | Change | Why | Creator benefit | Priority |
|---|---|---|---|---|
| 1 | **Background upload that starts when the file is picked** *(implemented)*, plus resume after a lost connection | Large mobile uploads are the riskiest step; waiting for a form first wastes minutes | Time-to-publish shrinks to typing time; a dropped connection doesn't mean starting over | High |
| 2 | **"Ready to earn" checklist** on first login: verify → add a payout method → upload → publish *(not requested)* | Creators should meet verification before the publish gate, not at it | Clear path to a first sale; fewer blocked publishes; higher activation | High |
| 3 | **Earnings and payouts view**: pending vs available balance, fees, next payout date, export *(not requested)* | Totals don't answer "when do I get paid?" | Trust and transparency; fewer support tickets | Medium |

---

## Assumptions and limitations

- **Identity checks are simulated.** Photos never leave the browser; only
  file names are saved. The quality checks are real; the review decision is
  simulated about 6 seconds after submission (rejected if a flagged ID
  photo was kept).
- **Media isn't stored.** The upload is simulated; thumbnails are resized
  to 640×360 in the browser and stored as data URLs.
- **USD only.** Date entry follows the browser's locale; other dates
  display in `en-US`.
- **Scheduled content** is released when the creator's pages next load, not
  by a background job.
- **Rate limits are in memory**, so they apply per server instance.
- **Not-found pages under a `loading.tsx` return HTTP 200**, because
  streaming has already started. This is documented Next.js behaviour; the
  page carries `noindex`.

## Research sources (verification UX)

- KYC drop-off and UX practices: [KYCAID](https://kycaid.com/blog/reduce-user-drop-off-kyc-verification-ux/), [Shufti Pro](https://shuftipro.com/blog/reduce-kyc-drop-off-ux-fixes/), [Zyphe](https://www.zyphe.com/resources/blog/reduce-kyc-onboarding-drop-off)
- Document capture guidance: [Stripe support](https://support.stripe.com/questions/uploading-photo-of-government-issued-id-faq), [Incode ID capture design](https://devhub.omnihub.incode.com/design-and-ux/id-capture-design.md), [Microblink](https://microblink.com/?p=4657)
- Selfie and liveness UX: [Veridas recommendations](https://docs.veridas.com/sap-sdk/ios-swift/v1.2/configuration/recommendations/), [Yoti](https://developers.yoti.com/identity-profiles/liveness)
- Retry and rejection states: [Persona help](https://help.withpersona.com/for-users/), [Xsolla creator payouts](https://developers.xsolla.com/creators/payouts-cc/)
- Wizard accessibility: [Trimble Modus](https://modus.trimble.com/components/web/wizard/accessibility), [Ezud](https://ezud.com/accessible-multi-step-wizard-forms/)

## Time spent

<!-- TODO(you): fill in your real numbers before submitting. -->
Approximately **_ hours** in total: _ h on the app, _ h on the architecture design, _ h on documentation and testing.

## Parts I implemented myself

<!-- TODO(you): describe what you did for each manual task and why. -->

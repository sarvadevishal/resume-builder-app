# ProofFit AI

ProofFit AI is a premium resume tailoring platform for data professionals who need truthful, ATS-safe, job-specific resumes with proof behind every important change.

It is designed to solve the biggest trust failures in resume AI products:

- generic AI output
- hallucinated experience
- keyword stuffing
- fake ATS scores
- weak parser compatibility
- privacy concerns
- hidden paywalls after upload

## Product promise

ProofFit AI is built around a simple rule: never invent what the resume does not support.

- Every important suggestion is linked to resume evidence
- Unsupported job requirements are shown as gaps
- ATS-safe output is a first-class feature
- Scoring is broken into transparent sub-scores instead of one magic number

## Tech stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase
- Stripe
- OpenAI API
- DOCX and PDF import/export
- Vitest for eval/unit tests
- Playwright for end-to-end workflow QA

## What is currently included

- Landing page, auth page, dashboard, workspace, ATS preview, pricing, settings, history, and admin views
- Resume upload pipeline with PDF/DOCX/text parsing
- Job description analysis route
- Tailoring engine with evidence mapping and guardrails
- PDF and DOCX export endpoints
- Privacy and deletion flows
- Supabase schema and seed files
- Prompt library, domain packs, eval plan, PRD, roadmap, and product memory files
- End-to-end QA coverage for the main local demo workflows

## Project structure

- `app/` App Router pages and API routes
- `components/` Shared UI, app layout, provider state, and workspace components
- `lib/` Prompts, services, validators, demo data, and local app state helpers
- `supabase/` SQL schema migration and seed data
- `tests/evals/` Guardrail and evaluation tests
- `tests/e2e/` Playwright workflow tests
- `context/` Durable product and technical memory
- `docs/` Supporting product copy and structure docs

## Prerequisites

- Node.js 20.9+ recommended
- npm 10+
- Windows PowerShell, Terminal, or any shell that can run Node/npm

## Quick start

1. Clone the repository:

```bash
git clone https://github.com/sarvadevishal/resume-builder-app.git
cd resume-builder-app
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

4. Start the development server:

```bash
npm run dev
```

5. Open the app:

- `http://localhost:3000`

## Environment variables

Create `.env.local` and fill in the values you need:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_PRO=
NEXT_PUBLIC_STRIPE_PRICE_TEAM=
```

## Running in local demo mode

The app works locally without full backend credentials for the core demo workflow.

Local demo mode includes:

- local sign-in and sign-up flow
- protected routes via demo session cookie
- upload and JD analysis flow
- tailoring workspace interactions
- local PDF and DOCX export
- settings, history, and pricing interactions

You only need real external credentials when you want to connect:

- Supabase auth and persistent database state
- Google OAuth via Supabase
- OpenAI live model responses
- Stripe checkout and billing

## Verification commands

Run all quality checks before shipping changes:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Main routes

- `/` Landing page
- `/auth` Sign in / sign up
- `/dashboard` Main app overview
- `/upload` Resume upload and parsing
- `/job-analysis` Job description analysis
- `/workspace` Tailoring workspace
- `/ats-preview` ATS parser preview
- `/history` Resume version history
- `/pricing` Plan selection
- `/settings` Privacy settings and audit log
- `/admin` Admin analytics overview

## Supabase setup

1. Create a Supabase project
2. Apply the SQL in `supabase/migrations/202604210001_prooffit_ai.sql`
3. Optionally seed demo records with `supabase/seed.sql`
4. Add your project keys to `.env.local`

Files:

- [schema migration](./supabase/migrations/202604210001_prooffit_ai.sql)
- [seed data](./supabase/seed.sql)

## Stripe setup

1. Create Stripe products/prices for Pro and Team
2. Add `STRIPE_SECRET_KEY`
3. Add `NEXT_PUBLIC_STRIPE_PRICE_PRO`
4. Add `NEXT_PUBLIC_STRIPE_PRICE_TEAM`
5. Add `STRIPE_WEBHOOK_SECRET`
6. Point your webhook to `/api/stripe/webhook`

## OpenAI setup

1. Add `OPENAI_API_KEY`
2. Set `OPENAI_MODEL` if you want a model different from the default
3. Replace or extend the local/demo tailoring path with live OpenAI-backed calls as needed

Prompt files:

- `lib/prompts/extract-resume.js`
- `lib/prompts/analyze-job-description.js`
- `lib/prompts/rewrite-resume.js`
- `lib/prompts/score-resume.js`

## Privacy behavior

The app is structured around privacy-first defaults:

- raw uploads should be deleted after extraction unless the user opts in
- structured resume persistence is an explicit choice
- deletion actions are exposed in settings
- audit activity is surfaced in the UI

## Known implementation note

This repository currently ships with a strong local demo workflow plus production-ready structure. Full production deployment still requires wiring real Supabase, OpenAI, and Stripe credentials and replacing local demo auth/session behavior with live backend auth.

## Documentation included in the repo

- [PRD](./PRD.md)
- [Prompt design](./PROMPT_DESIGN.md)
- [Evaluation plan](./EVALUATION_PLAN.md)
- [MVP roadmap](./MVP_ROADMAP.md)
- [Product memory](./context/product-memory.md)
- [Technical memory](./context/technical-memory.md)
- [Future enhancements](./context/future-enhancements.md)

## Recommended next steps

1. Connect Supabase auth and row-level security to live sessions
2. Replace local demo auth with real Supabase password and Google OAuth flows
3. Persist tailoring sessions and version history in the database
4. Wire live OpenAI generation for extraction, analysis, and rewrite steps
5. Wire live Stripe checkout and subscription sync
6. Add deployment configuration for Vercel or your preferred hosting platform

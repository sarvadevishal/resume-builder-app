# ProofFit AI

ProofFit AI is a premium resume tailoring platform built for data professionals who need truthful, ATS-safe, job-specific resumes with proof behind every important change.

## Why this product exists

Most resume tools fail the trust test. They hallucinate experience, inflate ATS scores, bury users behind paywalls after upload, and replace real accomplishments with generic AI sludge. ProofFit AI is designed to do the opposite:

- Only rewrite content supported by the source resume
- Show proof for every meaningful suggestion
- Separate scoring into transparent sub-scores
- Highlight unsupported requirements as gaps instead of inventing them
- Keep privacy controls and deletion workflows first-class

## Stack

- Next.js 15 App Router
- React 19 with functional components
- Tailwind CSS 4
- Supabase auth and Postgres
- Stripe billing
- OpenAI Responses API
- DOCX and PDF import/export

## Core product areas

- Marketing landing page and pricing
- Auth and dashboard flows
- Resume upload and parser pipeline
- Job description analysis
- Tailoring workspace with evidence panel
- ATS preview with parser warnings
- Version history
- Privacy settings and audit log
- Admin analytics overview

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env.local
```

3. Run the app:

```bash
npm run dev
```

4. Run tests:

```bash
npm test
```

## Project structure

- `app/`: App Router pages and API routes
- `components/`: shared UI and workflow components
- `lib/`: prompts, domain packs, services, validators, demo data
- `supabase/`: schema and seed data
- `tests/`: fixtures and evaluation suite
- `context/`: durable product memory and future enhancement notes

## Production notes

- Raw uploaded files should be deleted after extraction unless the user explicitly opts into storage
- AI outputs pass through validation before they become user-facing suggestions
- Billing gates paid exports and unlimited usage, but the app is designed to show meaningful results before charging
- The export pipeline uses a single-column ATS-safe document model by default

## What ships in this scaffold

- Production-minded architecture and guardrails
- Real schema, routes, prompts, validation logic, and test fixtures
- Premium UI with a data-professional-specific positioning
- Seed records and analytics scaffolding for internal operations

## Next implementation steps

1. Connect Supabase auth and row-level security to a real project
2. Add background processing for file extraction and large AI jobs
3. Wire Stripe checkout and subscription sync to webhooks
4. Replace demo data in pages with live session data from the database
5. Add browser-based DOCX/PDF previews before export

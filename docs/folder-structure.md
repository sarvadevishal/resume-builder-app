# Folder Structure

- `app/`
  App Router pages plus API routes for upload, analysis, tailoring, exports, privacy, and billing.
- `components/`
  Shared layout, premium UI blocks, and the tailoring workspace.
- `context/`
  Durable memory files for product direction, technical decisions, and future enhancements.
- `docs/`
  Landing copy and folder structure references.
- `lib/constants/`
  Domain packs and navigation metadata.
- `lib/data/`
  Demo data used by product surfaces and local development.
- `lib/openai/`
  OpenAI client setup.
- `lib/prompts/`
  Prompt library for extraction, JD analysis, rewriting, and scoring.
- `lib/schemas/`
  Structured output schemas for AI calls.
- `lib/services/`
  Parsing, analysis, scoring, export, privacy, Stripe, Supabase, and orchestration logic.
- `lib/validators/`
  Hallucination and evidence guardrails.
- `supabase/`
  Schema migration and seed data.
- `tests/`
  Fixtures and evaluation coverage for trust, ATS safety, and domain relevance.

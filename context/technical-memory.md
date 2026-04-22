# Technical Memory

## Stack choices

- Next.js App Router
- React functional components with JavaScript
- Tailwind CSS 4
- Supabase auth and Postgres
- Stripe billing hooks
- OpenAI Responses API for structured reasoning and rewriting

## Architecture decisions

- Keep AI prompts in `lib/prompts`
- Keep validation and safety rules in `lib/validators`
- Keep deterministic workflow logic in `lib/services`
- Store durable schema and sample records in `supabase/`
- Treat export generation as a server concern
- Preserve ATS-safe export heuristics in deterministic code, including line wrapping, section formatting, and parser-risk checks
- Persist local demo workflow state per signed-in user so refreshes do not erase upload, JD, export, or history state
- Use explicit user actions for data lifecycle controls: active workflow reset, resume/session deletion, and saved-history deletion

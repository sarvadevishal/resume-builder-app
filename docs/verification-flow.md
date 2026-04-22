# ProofFit AI Verification Flow

## Operator goal

Verify that a real tester can sign in, upload a resume, analyze a job description, tailor the resume, and export without broken state or dead-end steps.

## Flow

```mermaid
flowchart TD
    A["Open /auth"] --> B["Sign in"]
    B --> C["Go to /upload"]
    C --> D["Upload PDF or DOCX"]
    D --> E["Process resume"]
    E --> F["Review extracted sections"]
    F --> G["Continue to /job-analysis"]
    G --> H["Paste company, role, and JD"]
    H --> I["Analyze JD"]
    I --> J["Generate tailoring session"]
    J --> K["Review evidence-backed suggestions"]
    K --> L["Accept, reject, or manually edit"]
    L --> M["Export PDF or DOCX"]
    M --> N["Review ATS preview"]
    N --> O["Confirm saved version in history"]
```

## Pass criteria

- Resume upload completes without an extraction error
- The upload page shows at least one structured section
- JD analysis shows required skills, responsibilities, and gaps
- The workspace shows supported suggestions with source evidence
- PDF export downloads successfully
- DOCX export downloads successfully
- ATS Preview shows parsed sections and any warnings
- History shows at least one saved exportable version
- `Start new` clears the active workflow without deleting history
- `Clear stored resume data` clears the current resume/JD/session
- `Clear saved versions` removes user history

## Configuration needed for real-user beta

- Supabase project and migration applied
- Email auth enabled in Supabase
- Google provider enabled in Supabase if Google sign-in is desired
- OpenAI API key configured
- Stripe price IDs configured for billing tests

# Resume Export Module

ProofFit AI now uses a normalized resume export pipeline with shared data cleanup, format-agnostic template selection, and format-specific renderers.

## Architecture

- `lib/services/export/config.js`: format, mode, template, paper, margin, and font tokens
- `lib/services/export/normalize.js`: section normalization, cleanup, dedupe, ordering, and warnings
- `lib/services/export/pipeline.js`: resolved export preview plus renderer payload preparation
- `lib/services/export/renderers/pdf-renderer.js`: ATS-safe PDF output with selectable text
- `lib/services/export/renderers/docx-renderer.js`: editable Word-compatible DOCX output
- `lib/services/export/renderers/doc-renderer.js`: RTF-based `.doc` compatibility fallback
- `components/export/export-panel.js`: export settings UI and warning display

## Supported modes

- ATS
- Professional
- Compact
- Executive

## Templates

- ATS Classic
- Professional Modern

## DOC strategy

True legacy binary `.doc` generation is not practical in this stack without adding brittle conversion tooling. ProofFit AI now ships:

- native `.pdf`
- native `.docx`
- `.doc` compatibility output via RTF content served with a `.doc` extension

This keeps the export path production-safe, editable in Microsoft Word, and maintainable without depending on non-deterministic headless office conversion at runtime.

# Corpus

Documents every project retrieves over. Supported: `.md`, `.txt`, `.pdf` (PDFs are split per page so citations can point to a page).

Only this README and `sample/` are committed; everything else in `corpus/` is git-ignored, so large PDFs stay local.

## Suggested content
A domain with real structure, cross-references and entities works best for GraphRAG (P3) and the security proxy (P10):
- FCA Handbook — CONC (Consumer Credit sourcebook), especially CONC 7 (arrears, default and recovery)
- FCA Consumer Duty guidance (FG22/5)
- Consumer Credit Act 1974 (legislation.gov.uk)
- Public lender policy documents / T&Cs

Put them in sub-folders (e.g. `corpus/fca/`, `corpus/legislation/`) and run `pnpm ingest`.

`sample/example-lender-arrears-policy.md` is a short **fictional** policy so the stack can be tested before you add real documents.

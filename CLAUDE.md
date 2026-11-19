# agent-lab — notes for Claude

Learning repo: 12 AI-engineering projects (agents & RAG) in TypeScript with LangChain.js v1 and LangGraph.js. The owner is a senior backend engineer (Scala/ZIO background) — explain trade-offs, skip basics.

## Conventions
- pnpm workspace. Shared code in `packages/core`; each project in `packages/pNN-<name>` depending on `@agent-lab/core` (`"workspace:*"`).
- Packages export `src/*.ts` directly; run with `tsx`, check with `pnpm typecheck`. No build step.
- ESM only, relative imports end in `.js`.
- Zod v4 for all schemas. Ask for models via `chatModel("strong" | "cheap")`, never hard-code model names.
- Do not add `@langchain/community` (sunset); use dedicated `@langchain/*` packages.
- Each project: build the mechanism by hand first, then with the framework primitive; record results and the comparison in `docs/adr/NNNN-*.md` (template in `docs/adr/0000-template.md`).
- New behaviour needs tests (`vitest`). DB tests go in `*.integration.test.ts` and run only with `RUN_DB_TESTS=1`.
- Add golden cases to `golden/questions.jsonl` when a failure is found; never edit cases to make a run pass.

## Commands
- `pnpm db:up` · `pnpm ingest` · `pnpm smoke "question"` · `pnpm typecheck` · `pnpm test`

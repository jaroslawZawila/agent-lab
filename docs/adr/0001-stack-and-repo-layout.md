# ADR-0001: Stack and repo layout

- Status: accepted
- Date: 2026-11-19
- Project: P0 — setup

## Context
Twelve projects that build on each other (context assembly feeds memory, retrieval feeds agentic RAG and GraphRAG, the eval gate measures everything). Learning goal: understand the mechanisms, not only the framework APIs.

## Decision
- **TypeScript + LangChain.js v1 + LangGraph.js.** `createAgent` + middleware for agent loops; LangGraph for explicit state machines (P4, P5, P8).
- **Zod everywhere** for tool schemas, structured outputs and config.
- **pnpm monorepo**: `packages/core` holds shared plumbing; each project gets `packages/pNN-name`. Packages export TypeScript source directly (run with `tsx`, checked with `tsc --noEmit`) — no build step to maintain.
- **Postgres + pgvector** as the default store (vectors, checkpoints, memory store), via `@langchain/pgvector`. Redis for caching (P11), Neo4j only for GraphRAG (P3, `docker compose --profile graph`).
- **`@langchain/community` is not used**: it was sunset in 2026 (langchain-ai/langchainjs-community#61). Use dedicated `@langchain/*` packages or hand-written code instead.
- **Model tiers, not model names**: code asks for `chatModel("strong" | "cheap")`; the mapping lives in `.env` so P11 can replace it with a router.
- **One chunks table per embedding model** (`chunks_<model>_<dims>`) so switching embeddings never mixes vector sizes.
- **Deterministic chunk ids in metadata** + delete-by-docId before re-insert → ingestion is idempotent.

## Consequences
- Easy to swap providers and compare them; every later project inherits tracing, config and the golden set.
- PDFs are split per page, so citations can name a page (needed in P4).
- Synthetic embeddings (`EMBEDDING_MODEL=fake:synthetic`) let CI run DB tests without API keys, but say nothing about retrieval quality.

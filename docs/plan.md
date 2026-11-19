# Learning plan: 12 AI Engineering (Agents & RAG) projects

Source: Aryan Raj's LinkedIn post *"If you can build these 12 AI Engineering (Agents & RAG) projects. You're hired."*
Stack: TypeScript · LangChain.js v1 (`createAgent` + middleware) · LangGraph.js · Zod v4 · Postgres/pgvector · LangSmith

## Ground rules
- **One repo, one system.** Each project is a package (`packages/pNN-<name>`) on top of `packages/core`, so later projects plug into earlier ones and P12 is a write-up of something real.
- **One corpus throughout.** UK consumer-credit / collections material (FCA CONC, Consumer Duty, CCA, lender policies) in `corpus/`. Realistic retrieval, entities for the graph, PII for the security proxy.
- **Raw first, then the framework.** Build the core mechanism by hand, then rebuild it with the LangChain/LangGraph primitive and record what the abstraction hides.
- **Numbers, not vibes.** Every project reports results on `golden/questions.jsonl`.
- **One ADR per project** in `docs/adr/` (template: `0000-template.md`). These feed P12.
- Pace: ~6–8 h/week → ~16 weeks. Order follows dependencies, not the post's numbering.

## Progress

| Done | # | Project | Week | Package |
|---|---|---|---|---|
| ✅ | P0 | Setup | 0 | `packages/core` |
| ☐ | P1 | Context Assembler Engine | 1 | `p01-context-assembler` |
| ☐ | P2 | Hybrid Reranking Retrieval Stack | 2–3 | `p02-hybrid-retrieval` |
| ☐ | P4 | Self-Correcting Agentic RAG | 4 | `p04-agentic-rag` |
| ☐ | P5 | Durable Agent State Machine | 5 | `p05-durable-agent` |
| ☐ | P9 | Trajectory Eval CI Gate | 6 | `p09-trajectory-eval` |
| ☐ | P6 | Raw MCP Tool Server | 7 | `p06-mcp-server` |
| ☐ | P7 | 3-Tier Memory System | 8 | `p07-memory` |
| ☐ | P8 | Typed Multi-Agent Swarm | 9–10 | `p08-multi-agent` |
| ☐ | P3 | GraphRAG Knowledge Pipeline | 11–12 | `p03-graphrag` |
| ☐ | P10 | Inter-Agent Security Proxy | 13 | `p10-security-proxy` |
| ☐ | P11 | Semantic Cache + Routing Gateway | 14 | `p11-gateway` |
| ☐ | P12 | Public Architecture Teardown | 15–16 | `docs/` |

---

## P0 — Setup (week 0) ✅
- pnpm monorepo, `packages/core`: config, model tiers, embeddings, pgvector store, ingestion, golden-set loader.
- Docker Compose: Postgres+pgvector, Redis, Neo4j (`graph` profile). LangSmith tracing via `.env`.
- Uses `@langchain/pgvector`; `@langchain/community` is sunset and not used (ADR-0001).

## P1 — Context Assembler Engine (week 1)
**Post:** dynamic token budgeting, priority-based context injection, memory + retrieval + tool allocation, overflow prevention.
- **Raw:** `ContextAssembler` taking sources (system prompt, memory, retrieved docs, tool schemas, history), each with priority and min/max token budget; packs them into a fixed window. Overflow strategies: truncate, summarise, drop. Exact token counting per provider vs `countTokensApproximately`.
- **Framework:** `dynamicSystemPromptMiddleware`, `summarizationMiddleware` (trigger/keep), `contextEditingMiddleware`, custom `beforeModel` / `wrapModelCall` middleware.
- **Done when:** property-based tests prove no overflow at any budget; ADR on priority rules.

## P2 — Hybrid Reranking Retrieval Stack (weeks 2–3)
**Post:** BM25 sparse + dense vector search, cross-encoder reranking, metadata filtering, latency/accuracy tuning.
- **Raw:** Postgres full-text (`tsvector`, `ts_rank_cd`) or an in-process BM25, plus pgvector dense search, fused with reciprocal rank fusion written by hand; score normalisation; metadata filters (source, page, date).
- **Rerank:** cross-encoder via a rerank API (Cohere / Voyage) or locally with transformers.js.
- **Framework:** `EnsembleRetriever` / `ContextualCompressionRetriever` from `@langchain/classic`.
- **Done when:** table of recall@k, MRR and p95 latency for sparse vs dense vs hybrid vs hybrid+rerank on ~50 golden cases.

## P4 — Self-Correcting Agentic RAG (week 4)
**Post:** query rewriting, multi-step retrieval, citation grounding, abstention on low confidence, hallucination detection.
- **LangGraph:** retrieve → grade relevance → rewrite & retry (max N) → generate with citations → groundedness check → abstain below a confidence threshold.
- Zod structured outputs for every grader; graders use the `cheap` tier.
- **Done when:** hallucination and abstention rates on the golden set, with vs without the correction loop (uses `shouldAbstain` cases).

## P5 — Durable Agent State Machine (week 5)
**Post:** checkpointing, crash recovery, exponential retries, human-in-the-loop gates, resumable long-running workflows.
- Long-running workflow, e.g. "review a lender policy pack and produce a compliance report".
- `PostgresSaver` from `@langchain/langgraph-checkpoint-postgres`; thread ids; resume from checkpoint.
- Node retry policies with backoff; `modelRetryMiddleware` / `toolRetryMiddleware`.
- HITL: `interrupt()` + `Command({ resume })`; `humanInTheLoopMiddleware` (approve / edit / reject).
- **Done when:** a chaos test `kill -9`s the process mid-run and it resumes with no duplicated side effects (idempotency keys). ADR compares with ZIO `Schedule`/retry semantics.

## P9 — Trajectory Eval CI Gate (week 6, moved early on purpose)
**Post:** step-level grading, golden DAG comparison, PR blocking on deviation, LLM-as-judge calibration, regression detection.
- Record trajectories (tool calls + order); compare with `expectedTrajectory` (strict / unordered / subset).
- LLM-as-judge for answers; calibrate on ~50 hand-labelled cases, measure agreement, version the judge prompt.
- Tools: LangSmith datasets/experiments, `agentevals` (check maturity first), Vitest.
- GitHub Actions job fails the PR on regression beyond a threshold. Every later project runs through this gate.

## P6 — Raw MCP Tool Server (week 7)
**Post:** JSON-RPC implementation, strict schemas, permission scoping, sandboxed execution, no SDK dependency.
- **Raw:** JSON-RPC 2.0 over stdio, then Streamable HTTP; `initialize` handshake, `tools/list`, `tools/call`; Zod → JSON Schema (Zod replaces the post's Pydantic); per-tool permission scopes; sandboxed execution (child process / container, timeouts).
- **Then:** rebuild with the official MCP TypeScript SDK and consume from agents via `@langchain/mcp-adapters`; diff the two.
- **Done when:** a protocol conformance test suite passes against the raw server.

## P7 — 3-Tier Memory System (week 8)
**Post:** working scratchpad + episodic compression + semantic recall, importance scoring, TTL eviction, cross-session persistence.
- Working: graph-state scratchpad. Episodic: importance-scored session summaries. Semantic: facts in a Postgres-backed LangGraph `Store` with embedding search, namespaces per user, TTL eviction.
- All three are fed through the P1 Context Assembler.
- **Done when:** cross-session recall and eviction tests pass in CI.

## P8 — Typed Multi-Agent Swarm (weeks 9–10)
**Post:** Researcher/Coder/Reviewer topology, typed state passing, consensus voting, conflict resolution, supervisor orchestration.
- LangGraph supervisor; typed state with Zod; parallel fan-out with `Send`; reviewer voting and conflict-resolution rules.
- Compare supervisor vs handoff (swarm) topologies on cost, latency and success rate through the P9 gate.
- **Done when:** topology diagram + measured comparison.

## P3 — GraphRAG Knowledge Pipeline (weeks 11–12)
**Post:** entity extraction, relationship mapping, multi-hop traversal, community summaries, unstructured-to-graph conversion.
- Own Zod-structured entity/relationship extractor (the community `LLMGraphTransformer` is gone with the sunset) → Neo4j (`@langchain/neo4j` or the plain driver).
- Multi-hop Cypher traversal; community detection with Neo4j GDS (Leiden) + community summaries for global questions.
- Router: local (P2 hybrid) vs relational (graph) vs global (community summaries).
- **Done when:** a multi-hop question set where GraphRAG beats P2, with numbers.

## P10 — Inter-Agent Security Proxy (week 13)
**Post:** PII UUID masking, cross-agent injection sanitisation, least-privilege scoping, prompt-injection defence, audit logging.
- Proxy between agents and tools: PII → UUID tokens with a reversible vault; injection detection on tool outputs and inter-agent messages; least-privilege tool scopes per agent; append-only audit log.
- **Framework:** `piiMiddleware`, `toolCallLimitMiddleware`, custom `wrapToolCall` middleware.
- **Done when:** a red-team suite (injection in retrieved documents, exfiltration via tool arguments) runs in the P9 gate.

## P11 — Semantic Cache + Routing Gateway (week 14)
**Post:** prompt entropy analysis, model complexity routing, embedding-based caching, cost kill-switches, degradation chains.
- Semantic cache (Redis via `@langchain/redis`, or pgvector) with a tuned similarity threshold; complexity classifier routing `cheap` vs `strong`; `modelFallbackMiddleware` degradation chain; per-tenant cost budget with kill-switch.
- Replaces the static tier mapping in `core/models.ts`.
- **Done when:** replaying the golden set reports cost and latency saved vs quality lost.

## P12 — Public Architecture Teardown (weeks 15–16)
**Post:** published deep-dives, swarm topology diagrams, cost-per-task analysis, reproducible benchmarks, ADR documentation.
- Write-up of the whole system: architecture and topology diagrams, cost per task, reproducible benchmark scripts, the ADRs. Portfolio piece.

---

## Weekly rhythm
1. Read docs/papers for the concept (1–2 h).
2. Build the raw version (3–4 h).
3. Rebuild with the framework primitive; tests + golden-set run (2 h).
4. Write the ADR and tick the table above (30 min).

## References
- LangChain JS v1: docs.langchain.com/oss/javascript (agents, middleware)
- LangGraph JS: persistence, interrupts, Store, multi-agent
- MCP specification: modelcontextprotocol.io
- Microsoft GraphRAG paper (community summaries)
- LangSmith evaluation; agentevals (trajectory matching)

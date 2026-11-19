# agent-lab

Twelve AI-engineering projects (agents & RAG), built as **one evolving system** in TypeScript with LangChain.js v1 and LangGraph.js. Every project is measured against a shared golden set, and the final project is a public write-up of the whole system.

## Quick start

```bash
nvm use                  # Node 22+
pnpm install
cp .env.example .env     # add at least one chat-model key + an embeddings key, and LangSmith
pnpm db:up               # Postgres+pgvector and Redis in Docker
pnpm ingest              # corpus/ → pgvector
pnpm smoke "How long does a customer have to remedy a default notice?"
```

`pnpm typecheck` and `pnpm test` run without any API keys. Add your own documents under `corpus/` (see `corpus/README.md`).

## Layout

```
packages/core/         config, models (strong/cheap tiers), pgvector store, ingestion, golden-set loader
packages/pNN-*/        one package per project (added as we go)
corpus/                documents to retrieve over (only a fictional sample is committed)
golden/                evaluation cases, used by every project
docs/adr/              one decision record per project → raw material for P12
docker-compose.yml     postgres (pgvector), redis, neo4j (profile "graph")
```

## Roadmap

| # | Project | Week | Status |
|---|---|---|---|
| 0 | Setup: monorepo, pgvector, ingestion, tracing, golden set | 0 | ✅ |
| P1 | Context Assembler Engine | 1 | |
| P2 | Hybrid Reranking Retrieval Stack | 2–3 | |
| P4 | Self-Correcting Agentic RAG | 4 | |
| P5 | Durable Agent State Machine | 5 | |
| P9 | Trajectory Eval CI Gate | 6 | |
| P6 | Raw MCP Tool Server | 7 | |
| P7 | 3-Tier Memory System | 8 | |
| P8 | Typed Multi-Agent Swarm | 9–10 | |
| P3 | GraphRAG Knowledge Pipeline | 11–12 | |
| P10 | Inter-Agent Security Proxy | 13 | |
| P11 | Semantic Cache + Routing Gateway | 14 | |
| P12 | Public Architecture Teardown | 15–16 | |

Projects are numbered as in the original list but done in dependency order: the eval gate (P9) comes early so everything after it is measured.

## Working rules
1. Build the mechanism by hand, then with the framework primitive; write down what the abstraction hides.
2. Every project reports numbers on the golden set.
3. Every project ends with an ADR in `docs/adr/`.

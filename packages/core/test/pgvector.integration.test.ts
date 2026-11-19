import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGVectorStore } from "@langchain/pgvector";
import { REPO_ROOT, loadConfig } from "../src/config.js";
import { corpusStore } from "../src/db.js";
import { ingestCorpus } from "../src/ingest/index.js";

/**
 * Runs only when RUN_DB_TESTS=1 (CI sets it, with a pgvector service).
 * Uses offline synthetic embeddings, so no API key is needed.
 */
const enabled = process.env.RUN_DB_TESTS === "1";

describe.runIf(enabled)("pgvector ingest (integration)", () => {
  const cfg = loadConfig({
    ...process.env,
    EMBEDDING_MODEL: "fake:synthetic",
    EMBEDDING_DIMENSIONS: "64",
    CORPUS_DIR: path.join(REPO_ROOT, "corpus"),
  });
  let store: PGVectorStore;

  beforeAll(async () => {
    store = await corpusStore(cfg);
    await store.pool.query(`DELETE FROM ${store.computedTableName}`);
  });
  afterAll(async () => store?.end());

  it("is idempotent: re-ingesting replaces chunks instead of duplicating them", async () => {
    const first = await ingestCorpus(store, cfg.CORPUS_DIR);
    const second = await ingestCorpus(store, cfg.CORPUS_DIR);
    const { rows } = await store.pool.query(`SELECT count(*)::int AS n FROM ${store.computedTableName}`);

    expect(first.chunks).toBeGreaterThan(0);
    expect(second.chunks).toBe(first.chunks);
    expect(rows[0].n).toBe(first.chunks);
  });

  it("returns results with source metadata", async () => {
    const hits = await store.similaritySearch("default notice", 3);
    expect(hits).toHaveLength(3);
    expect(hits[0]?.metadata.source).toBe("sample/example-lender-arrears-policy.md");
  });
});

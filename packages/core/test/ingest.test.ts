import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../src/config.js";
import { loadGoldenSet } from "../src/golden.js";
import { loadCorpus } from "../src/ingest/load.js";
import { splitDocuments } from "../src/ingest/split.js";

const CORPUS = path.join(REPO_ROOT, "corpus");

describe("ingest pipeline (no database)", () => {
  it("loads the sample corpus and skips the corpus README", async () => {
    const docs = await loadCorpus(CORPUS);
    const sources = docs.map((d) => d.metadata.source);
    expect(sources).toContain("sample/example-lender-arrears-policy.md");
    expect(sources).not.toContain("README.md");
  });

  it("splits into bounded chunks with stable ids and source metadata", async () => {
    const docs = await loadCorpus(CORPUS);
    const a = await splitDocuments(docs, { chunkSize: 400, chunkOverlap: 50 });
    const b = await splitDocuments(docs, { chunkSize: 400, chunkOverlap: 50 });

    expect(a.length).toBeGreaterThan(3);
    for (const chunk of a) {
      expect(chunk.pageContent.length).toBeLessThanOrEqual(400);
      expect(chunk.metadata.source).toBeTruthy();
      expect(chunk.metadata.docId).toHaveLength(16);
    }
    expect(a.map((c) => c.metadata.chunkId)).toEqual(b.map((c) => c.metadata.chunkId));
    expect(new Set(a.map((c) => c.metadata.chunkId)).size).toBe(a.length);
  });

  it("parses the golden set", async () => {
    const cases = await loadGoldenSet();
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some((c) => c.shouldAbstain)).toBe(true);
  });
});

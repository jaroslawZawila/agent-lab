import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT, loadConfig, splitModelSpec } from "../src/config.js";
import { chunksTableName } from "../src/db.js";

describe("config", () => {
  it("applies defaults", () => {
    const cfg = loadConfig({});
    expect(cfg.MODEL_STRONG).toMatch(/^anthropic:/);
    expect(cfg.EMBEDDING_DIMENSIONS).toBe(1536);
    expect(cfg.CORPUS_DIR).toBe(path.join(REPO_ROOT, "corpus"));
  });

  it("resolves a relative corpus dir against the repo root", () => {
    expect(loadConfig({ CORPUS_DIR: "corpus/fca" }).CORPUS_DIR).toBe(path.join(REPO_ROOT, "corpus/fca"));
  });

  it("rejects a model without a provider", () => {
    expect(() => loadConfig({ MODEL_STRONG: "gpt-5" })).toThrow(/provider:model/);
  });

  it("splits model specs on the first colon only", () => {
    expect(splitModelSpec("openai:ft:gpt-4o:org")).toEqual({ provider: "openai", model: "ft:gpt-4o:org" });
  });

  it("derives a per-embedding-model table name", () => {
    const name = chunksTableName(loadConfig({ EMBEDDING_MODEL: "google-genai:gemini-embedding-001", EMBEDDING_DIMENSIONS: "768" }));
    expect(name).toBe("chunks_google_genai_gemini_embedding_001_768");
  });
});

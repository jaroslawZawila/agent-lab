import pg from "pg";
import { PGVectorStore } from "@langchain/pgvector";
import { loadConfig, type Config } from "./config.js";
import { embeddings as makeEmbeddings } from "./models.js";

export function createPool(cfg: Config = loadConfig()): pg.Pool {
  return new pg.Pool({ connectionString: cfg.DATABASE_URL, max: 5 });
}

/**
 * One chunks table per embedding model, so switching providers
 * (different vector sizes) never collides with existing data.
 */
export function chunksTableName(cfg: Config = loadConfig()): string {
  const slug = cfg.EMBEDDING_MODEL.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `chunks_${slug}_${cfg.EMBEDDING_DIMENSIONS}`.slice(0, 63);
}

/** The shared vector store over the corpus. Callers own `store.end()`. */
export async function corpusStore(cfg: Config = loadConfig(), pool: pg.Pool = createPool(cfg)) {
  return PGVectorStore.initialize(makeEmbeddings(cfg), {
    pool,
    tableName: chunksTableName(cfg),
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    dimensions: cfg.EMBEDDING_DIMENSIONS,
    distanceStrategy: "cosine",
    scoreNormalization: "similarity",
  });
}

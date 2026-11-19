import { randomUUID } from "node:crypto";
import type { PGVectorStore } from "@langchain/pgvector";
import { loadCorpus } from "./load.js";
import { splitDocuments, type SplitOptions } from "./split.js";

export interface IngestReport {
  files: number;
  pages: number;
  chunks: number;
}

/**
 * Load → split → embed → store. Idempotent per source file:
 * existing chunks for a docId are deleted before its new chunks are written.
 */
export async function ingestCorpus(
  store: PGVectorStore,
  corpusDir: string,
  opts: SplitOptions = {},
): Promise<IngestReport> {
  const pages = await loadCorpus(corpusDir);
  const chunks = await splitDocuments(pages, opts);
  const docIds = [...new Set(chunks.map((c) => c.metadata.docId))];

  for (const docId of docIds) {
    await store.delete({ filter: { docId } });
  }
  if (chunks.length > 0) {
    // pgvector's id column is a uuid; the deterministic chunkId lives in metadata.
    await store.addDocuments(chunks, { ids: chunks.map(() => randomUUID()) });
  }
  return { files: docIds.length, pages: pages.length, chunks: chunks.length };
}

export { loadCorpus, loadFile, docIdFor, type SourceMetadata } from "./load.js";
export { splitDocuments, type ChunkMetadata, type SplitOptions } from "./split.js";

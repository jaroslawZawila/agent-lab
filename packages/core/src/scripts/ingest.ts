/**
 * pnpm ingest — load everything under CORPUS_DIR into pgvector.
 * Safe to re-run: each source file's old chunks are replaced.
 */
import { chunksTableName, corpusStore, ingestCorpus, loadConfig } from "../index.js";

const cfg = loadConfig();
console.log(`Ingesting ${cfg.CORPUS_DIR}`);
console.log(`Embeddings: ${cfg.EMBEDDING_MODEL} (${cfg.EMBEDDING_DIMENSIONS} dims) → table ${chunksTableName(cfg)}`);

const store = await corpusStore(cfg);
try {
  const started = Date.now();
  const report = await ingestCorpus(store, cfg.CORPUS_DIR);
  console.log(
    `Done in ${((Date.now() - started) / 1000).toFixed(1)}s: ${report.files} files, ${report.pages} pages, ${report.chunks} chunks`,
  );
} finally {
  await store.end();
}

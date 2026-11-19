import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { PDFParse } from "pdf-parse";

export const SUPPORTED_EXTENSIONS = new Set([".md", ".txt", ".pdf"]);

export interface SourceMetadata {
  /** Stable id for the source file (hash of its path relative to the corpus root). */
  docId: string;
  /** Path relative to the corpus root, e.g. "fca/conc-7.pdf". */
  source: string;
  /** 1-based page number for PDFs; absent for text files. */
  page?: number;
}

export function docIdFor(relativePath: string): string {
  return createHash("sha256").update(relativePath).digest("hex").slice(0, 16);
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

/** Load every supported file under `root`. PDFs become one Document per page (keeps citations precise). */
export async function loadCorpus(root: string): Promise<Document<SourceMetadata>[]> {
  const docs: Document<SourceMetadata>[] = [];
  for await (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    const source = path.relative(root, file).split(path.sep).join("/");
    if (!SUPPORTED_EXTENSIONS.has(ext) || source === "README.md") continue;
    docs.push(...(await loadFile(file, source)));
  }
  return docs;
}

export async function loadFile(file: string, source: string): Promise<Document<SourceMetadata>[]> {
  const docId = docIdFor(source);
  if (path.extname(file).toLowerCase() !== ".pdf") {
    const text = await readFile(file, "utf8");
    return [new Document({ pageContent: text, metadata: { docId, source } })];
  }
  const parser = new PDFParse({ data: await readFile(file) });
  try {
    const result = await parser.getText();
    return result.pages
      .filter((p) => p.text.trim().length > 0)
      .map((p) => new Document({ pageContent: p.text, metadata: { docId, source, page: p.num } }));
  } finally {
    await parser.destroy();
  }
}

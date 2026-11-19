import { createHash } from "node:crypto";
import type { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { SourceMetadata } from "./load.js";

export interface ChunkMetadata extends SourceMetadata {
  chunkIndex: number;
  /** Deterministic chunk id: re-ingesting the same text yields the same id. */
  chunkId: string;
}

export interface SplitOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export async function splitDocuments(
  docs: Document<SourceMetadata>[],
  { chunkSize = 1000, chunkOverlap = 150 }: SplitOptions = {},
): Promise<Document<ChunkMetadata>[]> {
  const markdown = RecursiveCharacterTextSplitter.fromLanguage("markdown", { chunkSize, chunkOverlap });
  const plain = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });

  const out: Document<ChunkMetadata>[] = [];
  for (const doc of docs) {
    const splitter = doc.metadata.source.endsWith(".md") ? markdown : plain;
    const chunks = await splitter.splitDocuments([doc]);
    chunks.forEach((chunk, i) => {
      const chunkIndex = i;
      const chunkId = createHash("sha256")
        .update(`${doc.metadata.docId}:${doc.metadata.page ?? 0}:${chunkIndex}:${chunk.pageContent}`)
        .digest("hex")
        .slice(0, 32);
      out.push({
        ...chunk,
        metadata: { ...(chunk.metadata as SourceMetadata), chunkIndex, chunkId },
      } as Document<ChunkMetadata>);
    });
  }
  return out;
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { REPO_ROOT } from "./config.js";

/**
 * One line of golden/questions.jsonl. Grows with every project:
 * P2 uses expectedSources (recall@k), P4 uses shouldAbstain,
 * P9 adds expectedTrajectory (tool calls in order).
 */
export const GoldenCase = z.object({
  id: z.string(),
  question: z.string(),
  expectedAnswer: z.string().optional(),
  /** Corpus-relative paths (optionally "path#page") that a good retrieval should return. */
  expectedSources: z.array(z.string()).default([]),
  /** True when the corpus does not contain the answer and the system should say so. */
  shouldAbstain: z.boolean().default(false),
  expectedTrajectory: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
});
export type GoldenCase = z.infer<typeof GoldenCase>;

export async function loadGoldenSet(file = path.join(REPO_ROOT, "golden/questions.jsonl")): Promise<GoldenCase[]> {
  const lines = (await readFile(file, "utf8")).split("\n");
  return lines.flatMap((line, i) => {
    if (!line.trim() || line.trimStart().startsWith("//")) return [];
    try {
      return [GoldenCase.parse(JSON.parse(line))];
    } catch (err) {
      throw new Error(`golden/questions.jsonl line ${i + 1}: ${(err as Error).message}`);
    }
  });
}

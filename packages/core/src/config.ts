import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/** Repo root, resolved from this file so scripts work from any cwd. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** "provider:model" — the format LangChain's initChatModel understands. */
const ModelSpec = z
  .string()
  .regex(/^[a-z0-9-]+:.+$/, 'expected "provider:model", e.g. "anthropic:claude-sonnet-5-5"');

const EnvSchema = z.object({
  MODEL_STRONG: ModelSpec.default("anthropic:claude-sonnet-5-5"),
  MODEL_CHEAP: ModelSpec.default("anthropic:claude-haiku-5-5"),
  EMBEDDING_MODEL: ModelSpec.default("openai:text-embedding-3-small"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().max(2000).default(1536),
  DATABASE_URL: z.string().default("postgres://agent:agent@localhost:5432/agentlab"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  NEO4J_URL: z.string().default("bolt://localhost:7687"),
  NEO4J_USER: z.string().default("neo4j"),
  NEO4J_PASSWORD: z.string().default("agentlab-dev"),
  CORPUS_DIR: z.string().default(path.join(REPO_ROOT, "corpus")),
});

export type Config = z.infer<typeof EnvSchema>;

/** Parse and validate config. Pass an explicit env in tests. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const cfg = parsed.data;
  // Relative corpus paths are relative to the repo root.
  return { ...cfg, CORPUS_DIR: path.resolve(REPO_ROOT, cfg.CORPUS_DIR) };
}

export function splitModelSpec(spec: string): { provider: string; model: string } {
  const i = spec.indexOf(":");
  if (i <= 0) throw new Error(`Bad model spec "${spec}"`);
  return { provider: spec.slice(0, i), model: spec.slice(i + 1) };
}

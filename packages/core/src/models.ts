import { initChatModel } from "langchain";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { SyntheticEmbeddings } from "@langchain/core/utils/testing";
import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { loadConfig, splitModelSpec, type Config } from "./config.js";

export type ModelTier = "strong" | "cheap";

/**
 * Chat model by tier. Projects should ask for a tier, not a model name,
 * so P11 (routing gateway) can later swap the policy in one place.
 */
export async function chatModel(tier: ModelTier = "strong", cfg: Config = loadConfig()) {
  const spec = tier === "strong" ? cfg.MODEL_STRONG : cfg.MODEL_CHEAP;
  return initChatModel(spec, { temperature: 0 });
}

/** Embeddings from an "provider:model" spec. "fake:*" works offline (tests, CI). */
export function embeddings(cfg: Config = loadConfig()): EmbeddingsInterface {
  const { provider, model } = splitModelSpec(cfg.EMBEDDING_MODEL);
  switch (provider) {
    case "openai":
      return new OpenAIEmbeddings({ model, dimensions: cfg.EMBEDDING_DIMENSIONS });
    case "google-genai":
      return new GoogleGenerativeAIEmbeddings({ model });
    case "fake":
      return new SyntheticEmbeddings({ vectorSize: cfg.EMBEDDING_DIMENSIONS });
    default:
      throw new Error(`Unsupported embedding provider "${provider}" (use openai, google-genai or fake)`);
  }
}

/**
 * pnpm smoke "your question" — end-to-end check of the whole stack:
 * pgvector retrieval → tool → createAgent → model → LangSmith trace.
 * This is deliberately the naive baseline that P1, P2 and P4 will improve on.
 */
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { chatModel, corpusStore, loadConfig } from "../index.js";

const question = process.argv.slice(2).join(" ") || "How many days in arrears before the lender sends a default notice?";
const cfg = loadConfig();
const store = await corpusStore(cfg);

const searchCorpus = tool(
  async ({ query }) => {
    const hits = await store.similaritySearchWithScore(query, 4);
    if (hits.length === 0) return "No results. Has the corpus been ingested (pnpm ingest)?";
    return hits
      .map(([doc, score]) => {
        const where = doc.metadata.page ? `${doc.metadata.source}#p${doc.metadata.page}` : doc.metadata.source;
        return `[${where}] (score ${score.toFixed(3)})\n${doc.pageContent}`;
      })
      .join("\n\n---\n\n");
  },
  {
    name: "search_corpus",
    description: "Search the lending/collections document corpus. Returns passages with their source.",
    schema: z.object({ query: z.string().describe("A focused search query") }),
  },
);

const agent = createAgent({
  model: await chatModel("strong", cfg),
  tools: [searchCorpus],
  systemPrompt:
    "Answer only from passages returned by search_corpus. Cite sources in [brackets]. " +
    "If the passages do not contain the answer, say you don't know.",
});

try {
  console.log(`Q: ${question}\n`);
  const result = await agent.invoke({ messages: [{ role: "user", content: question }] });
  const answer = result.messages.at(-1);
  console.log(`A: ${typeof answer?.content === "string" ? answer.content : JSON.stringify(answer?.content)}`);
} finally {
  await store.end();
}

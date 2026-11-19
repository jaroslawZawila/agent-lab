# Golden set

`questions.jsonl` — one JSON object per line, validated by `GoldenCase` in `packages/core/src/golden.ts`.

| Field | Used from | Meaning |
|---|---|---|
| `id`, `question`, `tags` | P0 | identity and slicing |
| `expectedAnswer` | P4 | reference answer for LLM-as-judge |
| `expectedSources` | P2 | corpus paths (`path` or `path#page`) a good retrieval returns → recall@k, MRR |
| `shouldAbstain` | P4 | the corpus doesn't contain the answer; the right output is "I don't know" |
| `expectedTrajectory` | P9 | tool calls in order, for trajectory matching |

Rules: add cases whenever you find a failure; never edit a case to make a run pass; tag cases (`fact`, `multi-hop`, `abstain`, `injection`, …) so results can be sliced. Aim for ~50 real cases on your own corpus by the end of P2.

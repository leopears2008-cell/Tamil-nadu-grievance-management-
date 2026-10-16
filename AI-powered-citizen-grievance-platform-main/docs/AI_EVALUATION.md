# AI Evaluation and Safety

NivaranAI now includes a deterministic golden dataset that can run without Gemini credentials.

## Metrics

- Classification accuracy for department routing.
- Priority/severity accuracy.
- Keyword/entity coverage.
- Retrieval precision, recall and F1 helpers for future RAG datasets.
- Prompt-injection detection tests.
- A deterministic hallucination guard for unsupported resolution claims.

Run locally/CI with:

`bun run evaluate:ai`

The deterministic suite is a baseline, not proof of production AI quality. A production evaluation set should contain reviewed Tamil, English and Tanglish complaints, expected department/priority labels, known duplicate pairs, retrieval relevance judgments, and approved/unsupported answer facts. Live Gemini evaluation should be added only with an approved test budget and non-production data.

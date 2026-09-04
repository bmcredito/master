# ADR 0005 — AI Gateway

**Status:** Accepted

Future AI access goes through an internal `AIGateway`, with ModelRegistry, PromptRegistry, AIUsage, AIExecution and AIDecision concepts. LLMs are for classification, summarization, interpretation, strategy, language and explainability; deterministic calculations remain application code. OpenAI is not required in Phase 0.

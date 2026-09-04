# Architecture Overview

## Context

The platform is a multi-tenant SaaS. Tenant is the primary authorization and data-isolation boundary.

## Phase 0 services

- WEB: HTTP application, liveness and readiness endpoints.
- WORKER: long-running background process, reserved for asynchronous side effects.
- PostgreSQL: authoritative persistence.
- Redis: queue/runtime infrastructure.

## Boundaries

Business modules must enforce tenant context in backend services/repositories. Frontend filtering is never a security boundary.

Messaging is abstracted behind `MessagingProvider`; no domain module should depend directly on Evolution API.

AI is abstracted behind an internal `AIGateway`; OpenAI is a future provider, not a Phase 0 dependency.

## Event architecture

HTTP/domain action -> database transaction -> outbox event -> worker -> side effect.

Events will be idempotent and carry stable event IDs. Consumers must tolerate retries and duplicate delivery.

## Security

Secrets live only in environment/managed secret stores. Sensitive message content, complete documents, credentials and API keys are never logged.

## Observability

Structured logs are prepared for service, environment, requestId, tenantId, event and durationMs.

## Future evolution

Excel/CSV -> Importação -> Customer 360 -> Relationship Planner -> Messaging Governance -> Evolution API -> Conversation AI -> CRM -> Distribution -> Consultant.

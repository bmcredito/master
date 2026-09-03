# Security Foundation

- Tenant isolation is enforced in backend authorization/services/repositories.
- Secrets are supplied by environment/managed secret stores and are never committed.
- Future authentication uses secure cookies/tokens; exact mechanism is deferred to Phase 1.
- Input validation is centralized with Zod.
- `/health` is liveness only; `/ready` verifies PostgreSQL and Redis.
- Sensitive content and credentials are excluded from logs.
- Dependency audits are part of the CI/security checklist.

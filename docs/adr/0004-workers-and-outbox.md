# ADR 0004 — Workers and Outbox

**Status:** Accepted

Side effects follow database transaction -> outbox event -> worker -> side effect. Events have stable IDs and consumers must be idempotent. One controlled deployment step is responsible for production migrations; WEB and WORKER do not race to migrate.

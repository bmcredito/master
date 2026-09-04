# ADR 0001 — Architecture

**Status:** Accepted

Use a modular Next.js/Node application with separate WEB and WORKER processes, PostgreSQL as system of record and Redis for asynchronous infrastructure. Keep business boundaries explicit so future extraction remains possible.

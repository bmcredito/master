# ADR 0002 — Multi-tenancy

**Status:** Accepted

Tenant is the primary isolation boundary. Domain entities that are tenant-scoped carry `tenantId`. Authorization and repository/service constraints are mandatory; frontend filters are never trusted for isolation. Cross-tenant leakage tests are required in future domain phases.

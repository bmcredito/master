# Phase 1 security review

## Corrected findings

- IDOR and cross-tenant enumeration: repositories scope list and ID lookups by tenant before returning data.
- Horizontal escalation: tenant selection is accepted only after active-membership validation.
- Vertical escalation: service methods enforce centralized capabilities; UI visibility is not the security boundary.
- Team crossover: composite foreign key and scoped user/team lookups reject cross-tenant membership.
- Mass assignment: mutation APIs use strict Zod allow-lists.
- Session fixation: successful login replaces previous sessions and issues a fresh opaque token.
- Credential exposure: passwords use salted scrypt; session and invite values are stored only as hashes and are never logged.
- Brute force: login attempts are limited in Redis with generic failure messages.
- CSRF: mutation APIs reject mismatched origins; cookies are `sameSite=lax` and `httpOnly`.
- Unsafe deletion: historical relations use `RESTRICT` rather than cascading deletes.

## Remaining risks

- Email delivery is not integrated; authorized tenant administrators receive activation tokens once in the API response.
- Tenant-manager team scope is modeled and capability-gated, but row-level lead scope belongs to a later phase.
- PostgreSQL row-level security is not enabled; isolation is enforced through backend repositories, services, composite constraints and blocker tests.
- GitHub still reports `main` as default. It has no exclusive commits or local workflow references; changing repository settings requires the GitHub control plane and is deferred without deleting `main`.

# RBAC

Capabilities are centralized in `src/domain/access.ts`; business services never branch directly on role names. Tenant masters receive tenant administration, users, teams, audit and settings capabilities. Managers receive read access and team-member management. Consultants receive no administrative capability.

Access scopes prepare downstream domains: `TENANT_MASTER -> TENANT`, `TENANT_MANAGER -> TEAM`, `CONSULTANT -> ASSIGNED`. Platform administrators are excluded from tenant context and cannot silently act as consultants.

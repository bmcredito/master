# Audit

Administrative changes append a tenant-scoped `AuditEvent` inside the same Prisma transaction as the domain change and outbox event. Initial actions cover users, memberships, roles, teams and team members. Metadata is allow-listed by each service and excludes passwords, token values, cookies and unnecessary PII.

Indexes support tenant chronology, actor and action filters. Foreign keys preserve audit history and do not cascade on tenant deletion.

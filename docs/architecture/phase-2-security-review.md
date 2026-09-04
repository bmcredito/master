# Phase 2 security review

- Tenant filters are applied to customer, list, tag, import, row, and identifier reads/writes; composite foreign keys prevent cross-tenant relations.
- CSV/XLSX extensions and MIME types are checked, file/row limits are bounded, and formula-like cell values are rejected before persistence.
- Request bodies use strict Zod schemas; customer CPF is masked in frontend output and import source rows are not publicly exposed.
- Exact identifier matching is deterministic; name-only matching is prohibited and ambiguous/conflicting data is retained as an error/conflict rather than merged.
- Audit/outbox events cover customer creation, list creation, and import preview. Retention and deletion must follow the tenant's LGPD policy before production use of raw import data.

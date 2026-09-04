# Customer imports — Phase 2

CSV and XLSX uploads are size and row limited. The API parses and previews headers/rows before a separate start action. Parsed rows are retained as bounded JSON for traceability; no public file URL is created. A future object-storage adapter can replace this bounded retention without changing the domain.

The worker claims pending imports in chunks, processes each row independently, records errors, and is safe to retry because tenant-scoped identifier and list-member unique constraints make creation idempotent. The worker never infers contact history.

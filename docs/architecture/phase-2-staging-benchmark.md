# Phase 2 staging benchmark

The benchmark was executed on Railway environment `staging`, never on production. The staging services use the isolated `Postgres-ELBg` and `REDIS-STAGING` service references.

## Run

- Dataset: 10,000 synthetic CSV rows.
- Distribution: 9,900 unique rows, 50 repeated phones, 30 repeated CPFs, 15 empty names and 5 additional empty-name rows.
- Mapping: canonical fields plus explicit ignore for `internal_code`.
- Chunk size: 100 rows.
- Worker concurrency: one active worker.
- Result: `COMPLETED_WITH_ERRORS` with 9,980 processed and 20 row errors.
- Duration: 899,838 ms; observed throughput: 11 rows/sec.

## Reconciliation

The row-level database reconciliation was:

`9,900 NONE + 50 PHONE + 30 CPF + 20 ERROR = 10,000 rows`

The result was `RECONCILIATION = PASS`; `pending = 0`. The import produced 9,900 new customers, 80 deterministic matches and 20 invalid rows. Imported customers retained `NEVER_CONTACTED` and null contact timestamps; financial facts were stored with `IMPORTED` verification.

Railway metrics during the run reported current snapshots of approximately 691.8 MB WEB RSS, 235.5 MB WORKER RSS, 200.5 MB PostgreSQL RSS and 20.9 MB Redis RSS. Peak RSS, queue wait, transaction timing and connection counts were not instrumented by this run.

## Recovery and remaining closure gates

A controlled 300-row import was restarted during processing. It resumed and completed with 300 processed rows and zero errors.

Import-level advisory locking, concurrent-worker testing, stale-import timeout, explicit retry/DLQ policy and side-effect idempotency keys remain required before Phase 2 can be marked `SUCCESS`.

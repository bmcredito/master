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

## Post-hardening rerun

A second full upload was executed after the hardening migration on 2026-09-04:

- Import: `cmtnclxm50007nv0n2fp0aiez`.
- Pipeline: upload, mapping confirmation, asynchronous worker processing and terminal summary.
- Result: `COMPLETED_WITH_ERRORS`; 10,000 total, 9,980 processed, 20 errors.
- Wall-clock duration from creation to completion: approximately 483,999 ms.
- Queue wait reported: 14,979 ms; chunk size 100; worker `worker-39`.
- Final lock state: `lockedAt = null`; heartbeat advanced during processing; 102 batch claims were observed.
- Persisted metrics reported a final-batch processing time of 294 ms and RSS start/end of 163,598,336 bytes. The current implementation does not yet expose peak heap, per-chunk timing, database timing, transaction timing, or Redis queue-depth metrics; these are not acceptance evidence.

The synthetic rerun used 9,980 named rows and 20 blank-name rows. Its generated phone values were not valid under the current 10–13 digit normalizer, so it does not provide valid phone/CPF match evidence. The full-pipeline and row reconciliation result is recorded, but concurrency, stale recovery, retry injection/exhaustion, outbox recovery and idempotency redelivery gates still require controlled execution before merge.

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

## Valid identifier round

A controlled pre-seed created customers with phone-only and CPF-only identifiers. Import `cmtnegio707vuo00nnqwno3be` then completed the full 10,000-row pipeline with deterministic persisted counters:

- 9,900 customers created.
- 50 matches by normalized phone.
- 30 matches by normalized CPF.
- 80 matched customers updated through fact upserts.
- 20 blank-name rows reached terminal errors after 40 retry deliveries total.
- Reconciliation: `9,900 created + 50 phone + 30 CPF + 20 errors = 10,000`.
- Duration: 734,116 ms; throughput 14 rows/sec; queue wait 3,557 ms.
- 102 chunks of 100 rows; average 2,045 ms, p95 2,632 ms, maximum 3,080 ms.
- Dedup lookups: 12,815 ms aggregate; transactions: 194,113 ms aggregate and 19 ms average per processed row.
- RSS: 146,042,880 start, 172,212,224 peak, 166,973,440 end.
- Heap used: 34,068,048 start, 45,740,624 peak, 37,416,576 end; final heap total 70,152,192.
- One worker (`worker-39`); final lock released; 20 terminal dead-letter rows.

This round validates the full pipeline, phone/CPF matching, fact updates, deterministic reconciliation and persisted runtime metrics. It does not replace the still-pending controlled multi-worker, crash/stale recovery, redelivery and outbox acceptance scenarios.

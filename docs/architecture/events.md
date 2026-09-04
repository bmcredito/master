# Event Architecture

Future domain events include `CustomerImported`, `CustomerUpdated`, `MessageReceived`, `MessageSent`, `CustomerResponded`, `CustomerInterested`, `CustomerQualified` and `LeadAssigned`.

Pattern:

`HTTP / DOMAIN ACTION -> DATABASE TRANSACTION -> OUTBOX EVENT -> WORKER -> SIDE EFFECT`

Every event must have a stable identifier. Consumers must be idempotent, tolerate retries and avoid duplicate side effects.

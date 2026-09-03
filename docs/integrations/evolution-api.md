# Evolution API Preparation

Phase 0 intentionally does not deploy or integrate Evolution API.

Before Phase 3, validate the current supported release and document the exact pinned version. Do not use Docker `latest`.

Topics to validate at implementation time:

- deployment architecture on Railway;
- PostgreSQL and Redis requirements;
- webhook delivery and retry behavior;
- health endpoint;
- API authentication;
- secrets management;
- upgrade/rollback strategy.

The application domain will depend on `MessagingProvider`, not directly on Evolution API.

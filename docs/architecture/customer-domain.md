# Customer domain — Phase 2

Customers are tenant-scoped identities. A customer starts with `relationshipState=NEVER_CONTACTED`; imported rows never create contact, lead, negotiation, or interaction history.

Identifiers are normalized and unique within a tenant by type/value. Deterministic matching uses valid CPF first, then phone, then email. Names alone never merge records. Conflicting or ambiguous matches remain traceable instead of being silently merged.

Facts retain their source and use `verification=IMPORTED` until an authorized human confirms them. CPF is masked in UI responses.

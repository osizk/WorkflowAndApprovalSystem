# System-Level Software Design — Sprint 1

Version 0.1, review baseline. Sources: Deliverable 1 §4.1 Parts B–E and [SRS](srs.md). Feature-level behavior and verification are in the [contracts](sprint-1-contracts.md). Decisions D-01–D-06 follow the staged SRS. Technology and interface choices below are proposed for review; implementation starts against the accepted revision.

## Architecture and deployment

Proposed stack: TypeScript with a browser client, Node.js HTTP application, and PostgreSQL. Select exact frameworks, supported versions and migration tooling in the accepted revision before the dependent implementation. Serve the production browser bundle and JSON API on one origin. HTTP handlers parse inputs and resolve sessions; feature services apply authorization and transition rules; database adapters enforce persistence and constraints. The browser never connects directly to PostgreSQL.

```mermaid
flowchart LR
  Browser -->|HTTPS /api| HTTP[HTTP and session checks]
  HTTP --> Service[Request and review services]
  Service --> DB[(PostgreSQL)]
```

Use versioned migrations and synthetic accounts for local setup. Keep database connection and session settings server-side in environment variables; publish only example values. Tests run against an isolated database with deterministic fixtures. Future deployment uses HTTPS, separate runtime credentials and a persistent managed database; run migrations as a controlled release step before traffic, then check login and the full purchase journey. Containerization, hosted deployment and CI completion belong to later work.

## Data and access

```mermaid
erDiagram
  USER ||--o{ SESSION : owns
  USER ||--o{ PURCHASE_REQUEST : submits
  USER ||--o{ PURCHASE_REQUEST : reviews
  PURCHASE_REQUEST ||--o{ REQUEST_EVENT : records
  USER ||--o{ REQUEST_EVENT : acts
```

User has an opaque ID, unique login, password hash and one role (Requester or Reviewer). Session stores an opaque token digest, user FK and expiry. Preset reviewer mapping identifies at most one reviewer per requester. A request stores its immutable requester and reviewer FKs, title, purpose, exact amount in integer satang, status and creation time. Event stores request FK, actor FK, event type, time and optional reason. Index requester/reviewer list lookups and history by request; disallow equal requester and reviewer IDs. Request creation and its submission event share a transaction. The decision uses a conditional status update from SUBMITTED and inserts its event in the same transaction; a lost race writes no event.

| Operation | Requester | Reviewer |
| --- | --- | --- |
| Submit | Own identity from session | Forbidden |
| List/detail/history | Own requests | Assigned requests |
| Approve/reject | Forbidden | Assigned submitted request, never own |

Use consistent JSON errors containing a stable code and safe message, with per-field validation details where applicable. Use UTC timestamps and stable opaque IDs. Show loading, empty, retry, validation and success states in the browser; provide keyboard operation, visible focus, labels, text status and field-associated errors. Resolve roles and scope on every server operation; UI controls reflect those checks.

## Feature inventory and traceability

| Feature | Sprint | SRS coverage | Depends on | Verification / gap |
| --- | --- | --- | --- | --- |
| F-01 Identity and session | 1 | FR-01; BR-01; NFR-02–04 | Seed users | AC-01–03 / TEST-01–03 |
| F-02 Submit and retrieve | 1 | FR-02–03; BR-01, BR-03–04, BR-09; NFR-01–02, NFR-04 | F-01, schema, reviewer mapping | AC-04–08 / TEST-04–08 |
| F-03 Review and history | 1 | FR-04–06; BR-02, BR-05–08; NFR-01–02, NFR-04–05 | F-01, F-02, transaction support | AC-09–13 / TEST-09–13 |
| F-04 Return/revise/resubmit | 2 | FR-07 | F-02, F-03 | Later contract |
| F-05 Filter work lists | 2 | FR-09 | F-02, F-03 | Later contract |
| F-06 Decision summaries | 3 | FR-10 | F-03 | Later contract |
| Release checks | 1 | NFR-06; cross-feature NFR-01, NFR-03–04 | F-01–03 | AC-14 / TEST-14 |
| Additional approval stages | Unscheduled | FR-08 candidate | Scope approval | Outside baseline |

No SRS requirement IDs were added or changed. All verification rows are planned; actual test paths, results and tested release commit will be recorded after execution.

## Three-sprint plan

1. Sprint 1 delivers a locally runnable purchase request from seeded login through a persisted reviewer decision. Completion requires the contracts, end-to-end journey, negative tests and reviewed integration evidence.
2. Sprint 2 adds return/revise/resubmit and list filters (F-04–05) after the Sprint 1 transition rules and ownership checks are stable. Demonstrate a revised submission and scoped filtering.
3. Sprint 3 adds decision summaries (F-06) and hardens the accepted workflow. Verify that reports respect role and ownership rules and that the release can be reproduced.

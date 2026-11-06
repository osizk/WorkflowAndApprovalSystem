# Software Requirements Specification — Workflow and Approval System

**Version:** draft 0.1, 7 November 2026. **Status:** Issue #1 draft on `codex/s1-01-srs`; no implementation or verification is claimed.

**Sources:** `docs/sprint1/group_work_specs_v1.pdf` (Theme 5 and engineering baseline) and `docs/sprint1/project_deliverable_1_v1.pdf` (Deliverable 1 rubric). This SRS is intended for Part A of the self-contained Deliverable 1 PDF.

## Context and actors

An internal department needs a controlled way to submit purchase requests and record approval decisions. The purchase context is proposed under D-01, not prescribed by the course. A **Requester** submits and reads their own requests. An assigned **Reviewer** reads and decides requests assigned to them. Seeded synthetic accounts are sufficient for Sprint 1.

## Scope and exclusions

Sprint 1 covers login, logout, current identity, request submission and retrieval, assigned review, approval or rejection, persisted decision history, and backend permission and transition checks. Sprint 2 is planned for return/revise/resubmit and filtering. Sprint 3 is planned for decision summaries and product hardening. Additional approval stages remain outside the accepted baseline pending an explicit scope decision. No real payment, external messaging, self-registration, or password recovery is included.

The application must use a real UI, API/application layer, and persistent database. Docker, CI and GCP deployment are later Lab 5 work; the Sprint 1 release must be locally runnable and suitable for later deployment.

## Functional requirements

| ID | Requirement | Planned feature/sprint |
| --- | --- | --- |
| FR-01 | A seeded user can log in, retrieve their server-verified identity, and log out. | F-01 / Sprint 1 |
| FR-02 | A Requester can submit a valid purchase request and retrieve its saved detail and status. | F-02 / Sprint 1 |
| FR-03 | A Requester can list and read only their own requests. | F-02 / Sprint 1 |
| FR-04 | A Reviewer can list and read only requests assigned to them. | F-03 / Sprint 1 |
| FR-05 | An assigned Reviewer can approve or reject a submitted request. | F-03 / Sprint 1 |
| FR-06 | Authorized users can retrieve the persisted decision and state history for a request. | F-03 / Sprint 1 |
| FR-07 | A returned request can be revised and resubmitted under an agreed later contract. | F-04 / Sprint 2 |
| FR-08 | Candidate only: additional approval stages require an approved baseline change before becoming a requirement. | Outside current baseline; no sprint committed |
| FR-09 | Authorized users can filter their request or review lists. | F-05 / Sprint 2 |
| FR-10 | Authorized users can view decision summaries without seeing unrelated private requests. | F-06 / Sprint 3 |

## Business rules

| ID | Rule | Decision |
| --- | --- | --- |
| BR-01 | A request is owned by its authenticated Requester; client-supplied user IDs or roles never grant access. | Course-required |
| BR-02 | A review decision is allowed only for the assigned, authenticated Reviewer, who must differ from the Requester. | Course-required; assignment method D-02 |
| BR-03 | If no eligible preset Reviewer exists, submission is rejected without saving a submitted request. | Proposed D-02 |
| BR-04 | After submission, the request cannot be edited in Sprint 1. | Proposed D-03 |
| BR-05 | Rejection requires a nonblank reason; approval reason is optional. | Proposed D-04 |
| BR-06 | Only a submitted request may be approved or rejected; repeated, concurrent, or otherwise invalid decisions leave status and history unchanged. | Course-required transition rule |
| BR-07 | A successful decision changes status and writes one history entry atomically. | Course-required persistence behavior |
| BR-08 | Sprint 1 has one approval stage; later stages require an agreed change. | Proposed D-06 |
| BR-09 | A request needs a title of 3–120 characters and purpose of 10–2,000 characters, counted after trimming outer whitespace, plus an exact THB amount from 0.01 to 1,000,000.00 with at most two decimal places. Both bounds are inclusive. | Proposed D-05 |

## Important nonfunctional requirements

| ID | Measurable target and verification |
| --- | --- |
| NFR-01 | Persisted request, decision, and history data survive an application restart and database reconnection; verify by creating and deciding a request, restarting the application, then retrieving the same records. |
| NFR-02 | Every protected API operation enforces authenticated role, ownership, and Reviewer assignment; verify valid and forbidden cases with API/database integration tests. |
| NFR-03 | Passwords managed locally are stored only as hashes; credentials and tokens are excluded from repository, client bundle, logs, and PDF evidence. Verify configuration and inspect code/diff/evidence. |
| NFR-04 | The critical UI journey is keyboard operable with labels, visible focus, text status, field-associated errors, and responsive layout without page-level horizontal overflow; verify selected desktop/mobile and keyboard checks. |
| NFR-05 | A valid request decision updates status and history together, and rejected or competing decisions write neither partial result; verify with API/database integration tests. |
| NFR-06 | The accepted Sprint 1 release has documented local setup, migration/seed, run, build, and test commands; verify them on the submitted commit. |

## Decisions, assumptions, and open points

| ID | Choice and status | Evidence/next action |
| --- | --- | --- |
| D-01 | Internal purchase requests — proposed by the students' delegated agents; pair approval still to be recorded. | Confirm exact context in Issue #1/PR review. |
| D-02 | Preset eligible Reviewer; block submission if none is eligible — proposed. | Contract must define mapping and no-reviewer API response. |
| D-03 | Lock after submission — proposed. | Contract must reject edit attempts. |
| D-04 | Rejection reason required, approval reason optional — proposed. | Contract must define whitespace and length checks. |
| D-05 | Title 3–120 characters, purpose 10–2,000 characters after trimming outer whitespace; exact THB amount 0.01–1,000,000.00 with at most two decimal places — proposed through delegated agents. | Course brief sets no numeric limits. Record pair review before F-02 contract or coding; test both inclusive bounds and first invalid values. |
| D-06 | One stage in Sprint 1 — proposed. | Any later stage needs a scoped, approved change. |

Status labels describe decisions only; they do not claim implementation, test execution, teammate PR review, or release. Feature mapping and AC/TEST IDs are to be completed in Issues #2 and the Sprint 1 contracts. The final video-duration contradiction is outside Deliverable 1 and remains for instructor/TA clarification.

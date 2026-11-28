# Sprint 3 feature contract — F-06 Decision Summary

Version 1.0 locked on 28 November 2026 with Kane's confirmation. Implementation and verification are pending.

F-06 implements FR-10 and depends on F-03 and the existing authenticated request workspaces. The Deliverable 2 checkpoint covers #82 (Kane, API and database tests) and #85 (Pex, UI and browser tests). Each student reviews the other's contribution.

Kane reported checking shared docs and tests on main (bf1e6f4) and sprint2-staging (66ffe3a) and finding no collisions for AC-35–39 or TEST-35–39. Issue #82 owns TEST-35–36 and issue #85 owns TEST-37–39.

## API and data

GET /api/requests/decision-summary takes no query parameters. Register it before /api/requests/:id. A successful response is 200 with both approved and rejected present as nonnegative integers, including zeros for an empty authorized set. A missing or expired session returns 401 AUTH_REQUIRED. An unexpected server error returns 500 INTERNAL_ERROR. Errors use the existing { "error": { "code": "...", "message": "..." } } envelope.

Use the authenticated identity to scope the existing purchase requests by requester ownership or reviewer assignment. Count each request once by its current status across the entire authorized set. APPROVED and REJECTED contribute to their respective totals. SUBMITTED, RETURNED and WITHDRAWN do not contribute. No schema change, stored counter or history mutation is needed.

## UI

Show a labeled, read-only Decision summary with Approved and Rejected totals on My Requests and Review Queue. List filters and pagination do not affect it. Show a loading state and display zeros only after a successful response. Follow the existing sign-in flow on 401. On server or network failure, show a summary error and keyboard-accessible Retry while the list remains usable. Keep labels and values readable on narrow screens.

## Acceptance criteria and software test specification

| AC / Test | Level and owner | Setup, action and expected result |
| --- | --- | --- |
| AC-35 / TEST-35 | API/DB · Kane | Seed owned, assigned and unrelated requests in each status. Query as each role and verify exact totals, isolation and both zero fields for an account with no visible final decisions. |
| AC-36 / TEST-36 | API/DB · Kane | Query without a session and with an expired session. Both return 401 AUTH_REQUIRED. Inject an unexpected repository failure and verify 500 INTERNAL_ERROR and the standard error envelope. |
| AC-37 / TEST-37 | Browser · Pex | Open both list pages using accounts with different authorized totals. Verify both labels and values, including a separate successful zero result. Change page, status and clear the filter. Totals stay the same. |
| AC-38 / TEST-38 | Browser · Pex | Hold the summary request pending, then exercise server and network failures. Verify loading, usable list, no placeholder zeros, and recovery using Retry. Exercise 401 separately and verify the existing sign-in flow. |
| AC-39 / TEST-39 | Browser, integrated · Pex | Record both totals before Return. Check both totals after Return and again after Resubmit. At each checkpoint, both match the baseline. After Approve, verify Approved equals baseline plus one and Rejected equals baseline. Reload and verify both post-Approve totals again. |

## Definition of Done

Record AC and TEST IDs in the shared traceability index. Link actual test files, commands, results and commit. Retain meaningful failing and passing evidence, obtain teammate review, run integrated regression, and verify the deployed candidate with both roles. Preserve the prior Sprint 2 release SHA separately. Disclose pending or failed checks in Deliverable 2.

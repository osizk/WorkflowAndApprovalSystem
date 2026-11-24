> Original discovery report, preserved as a historical checkpoint. The partner subsequently independently reproduced the finding. CORRECTION-STATUS.md and CORRECTED-RELEASE-WF-FIX-001.md describe the reviewed and deployed correction. Independent corrected-live retest remains pending.

# WF BUG 001 Oversized login JSON is reported as an internal server failure

See LAB-6-AI-USE-AND-CONTRIBUTIONS.md for the required AI-use and contribution declaration.
Status Reproduced in deployed Workflow. Proposed severity Minor, pending team triage.

Reproduced during product-team investigation using live browser/API checks and a standalone automated regression. Independent partner confirmation remains pending.

## Tested version and context

- URL https://scd928edd-4d7hbszvwq-as.a.run.app/login
- Observed release marker full title 82a4806b5291b57ad7e76a28fb7d40e1e947b9a6
- Matching local repository HEAD 82a4806b5291b57ad7e76a28fb7d40e1e947b9a6
- Live browser boundary reproduction 24 November 2026, 17:23:17 Asia/Bangkok, equivalent to 2026-11-24T10:23:17.243Z
- Automated reproduction 24 November 2026, 17:23:51 Asia/Bangkok
- Cloud Run revision/digest/traffic have not been independently read back during this investigation. The visible application marker establishes the reported build identifier.

## Reproduction

Preconditions A fresh signed-out browser at the Workflow origin. No account password or database fixture is required.

1. POST /api/session with Content-Type application/json and a same-origin Origin header.
2. Use JSON.stringify({unexpected: 'x'.repeat(102384)}). This is valid JSON of exactly 102401 UTF-8 bytes, one byte above the existing 100 KiB parser limit. It has no credentials.
3. Observe HTTP status and JSON error.
4. For comparison, send JSON.stringify({unexpected: 'x'.repeat(102383)}), exactly 102400 bytes.

| Request size in bytes | Actual status | Actual error code |
|---|---|---|
| 17 | 422 | VALIDATION_ERROR |
| 90017 | 422 | VALIDATION_ERROR |
| 102400 | 422 | VALIDATION_ERROR |
| 102401 | 500 | INTERNAL_ERROR |
| 110017 | 500 | INTERNAL_ERROR |

Actual oversized response is {"error":{"code":"INTERNAL_ERROR","message":"Unexpected server error"}}.

Expected oversized response is HTTP 413 with a safe JSON error envelope. Express documents entity.too.large as a 413 parser error. The application should preserve that client-error classification instead of converting it into a server failure. The project's contract specifies a JSON error envelope and known validation/authentication responses, but does not explicitly name a payload-size limit or 413 code. Record that distinction during triage. The existing parser already imposes the limit.

The browser identity check after the first three probes returned 401 AUTH_REQUIRED. Source review shows oversized rejection happens in express.json before login/database handling. These unauthenticated probes supply no credentials or business records. Database-row absence was not independently queried.

## Impact and requirement reference

F-01 login API and the shared error-response handling are affected. Normal bounded requests continue to return their validation error. Oversized client input is incorrectly classified as an internal outage, producing misleading API behavior and potentially unnecessary server-error logging. No outage, credential exposure or data loss was demonstrated.

Proposed Minor severity reflects the limited demonstrated impact. The team and independent testers must determine its assessed disposition. This finding alone does not establish completion of Lab 6 or independent acceptance.

## Cause identified in matching source

src/auth.ts line 56 installs express.json() with the default limit.

The error handler at lines 104–107 handles entity.parse.failed specifically, then converts every other error to status 500. It consequently converts entity.too.large and its original 413 status to INTERNAL_ERROR.

Framework source reference https://expressjs.com/en/resources/middleware/body-parser/#request-entity-too-large

## Automated regression and actual RED evidence

File oversized-login.test.mjs uses Node's built-in test runner and the real deployed endpoint. It sends two bounded credential-free requests.

Run from the workspace root

    node --test lab6-evidence/workflow/WF-BUG-001/oversized-login.test.mjs

Use WORKFLOW_UAT_ORIGIN to target a later agreed test deployment.

Observed test outcome in red-output.txt

- Control at 102400 bytes passed, actual 422 VALIDATION_ERROR.
- Oversized request at 102401 bytes failed, actual 500 versus expected 413.
- Totals 2 tests, 1 passed, 1 failed, 0 skipped.

An initial sandboxed attempt failed to connect with EACCES. The saved RED output comes from the subsequent approved network run, where both requests reached the app and the second failed the intended status assertion.

## Follow-through for Lab 6

1. Thira and Ashira review this finding and its proposed severity/disposition.
2. Give the independent team the reproduction and identify its product-team discovery honestly. Their later reproduction is independent confirmation.
3. If accepted, integrate an appropriate regression through the project's test workflow, correct error handling on a fix branch, preserve GREEN and relevant regression results, obtain teammate review/CI and deploy through the reviewed release path.
4. ClassPulse independently retests the corrected deployed version and records the actual outcome.
5. Include version mapping, report/disposition, RED/GREEN, review/CI/deployment and independent retest in the final PDF.

Fix, GREEN evidence, review, deployment and independent retest remain pending.

# WF-BUG-001 independent confirmation by ClassPulse Student A

24 November2026. Actual operator: Codex in Student A/Punge089's session. First discovery and original reproducer are attributed to the Workflow Product Team. A reviewed and independently ran their supplied regression unchanged; this is independent execution/confirmation, not independent discovery or independent test design. B's participation is not inferred.

## Observed result

Target https://scd928edd-4d7hbszvwq-as.a.run.app/api/session . The two requests contained only an unexpected field with synthetic x characters, no login/password/cookies and no business-record input. Same-origin Origin header was set. No load-testing loop was used.

| Actual observation time Asia/Bangkok | UTF-8 request size | Expected | Actual |
|---|---|---|---|
|24Nov2026 19:09:37.819|102400 bytes|422 VALIDATION_ERROR control|422 VALIDATION_ERROR|
|24Nov2026 19:09:37.992|102401 bytes|413 with safe JSON error envelope|500 INTERNAL_ERROR, Unexpected server error|

Command: bundled Node `--test autopilot/wf-bug-001-confirmation/oversized-login.test.mjs`, environment WORKFLOW_UAT_ORIGIN explicitly set to the target above. Actual outcome:2tests,1passed,1failed,0skipped,exit1. The failed assertion is the intended oversized-body status check, not a connectivity failure. Full actual output is in actual-output.txt; source test hash matches the received test.

Afterward a credential-free GET /api/session at19:12:04.645Bangkok returned401 AUTH_REQUIRED. This confirms the unauthenticated request outcome; it does not query DB session-row absence.

## Version and expected-behavior basis

The public login page still displayed marker82a4806b5291, saved in public-marker.txt with observation time. GitHub lab5 tag resolves to82a4806b5291b57ad7e76a28fb7d40e1e947b9a6. Matching a visible marker and tag is not a fresh full Cloud Run serving-revision/digest/traffic mapping; that remains pending from the Workflow team. Treat this as the requested provisional live confirmation, with that version qualification, not a frozen full-release acceptance.

Expected413 is grounded in the [official body-parser oversized-body error specification](https://expressjs.com/en/resources/middleware/body-parser/#request-entity-too-large). The Workflow Sprint1 contract names a safe JSON error envelope but does not explicitly specify a body-size limit or413 code. Preserve this distinction in triage; do not invent a preexisting explicit AC. No outage, credential exposure or data loss was demonstrated. Proposed severity remains Minor, pending the actual Product Team's decision.

## Follow-through

Send this actual independent confirmation to EN-037_P5 through the agreed channel. They own triage, any in-repo reproducer, correction, GREEN/regression evidence, peer review, CI and corrected deployment. ClassPulse A/B then independently retests the corrected deployed version with explicit serving-version confirmation and retains this original failure. A did not change their repository, fix the app, claim GREEN or sign acceptance.

This Workflow defect does not satisfy ClassPulse's own PartD correction/retest requirement. No intentionally reintroduced ClassPulse defect was chosen or added by this work.

# WF-BUG-001 independent corrected-release retest

Result: **PASS for the original defect reproduction**. This is a scoped independent retest, not final whole-product acceptance and not ClassPulse Part D.

Operator: Codex GPT-6 under Student A/Punge089. Actual run24November2026,23:03:13.097–23:03:15.462 Asia/Bangkok (16:03:13.097–16:03:15.462 UTC). No credential was used, no valid session was created and no business record was modified. Existing A/B synthetic requests were preserved; this run did not authenticate to reread all of them.

Release WF-FIX-001: source `ad2cbef67decf9953219694898327dea0bb66034`, marker `ad2cbef67dec`, revision `scd928edd-00008-9zd`, digest `sha256:26459db1d0278afcac49ec298c2c7d0523c7fc6eef75eeb40e7f18561e34ca43`,100% traffic. Cloud mapping is C/D's supplied fresh read-only evidence at22:37:46 Bangkok, not A's own cloud readback. A independently checked merged PR64 and successful deployment45426749596 at this source, same-origin served full-source constant before/after, and rendered browser footer before/after. Browser screenshot was saved after execution. Served asset hash stayed unchanged.

| Original reproduction | Expected | Actual | Result |
|---|---|---|---|
|102400-byte JSON POST/api/session, missing login/password|422 validation envelope|422 VALIDATION_ERROR|PASS|
|102401-byte JSON POST/api/session|413 JSON client-error envelope|413 PAYLOAD_TOO_LARGE|PASS|

The unchanged original A reproducer SHA256 is `13adcb704d406d0580a49d77b222a90d9a25fed3a691f7df852c507735c93be4`; it also matches C/D's supplied retest script. Command: `node --test oversized-login.test.mjs`. Actual2passed/0failed/0skipped. The original defective-release run remains separate:2tests,1pass/1fail;102401bytes returned500. Developer checks supplied by C/D are not counted as this independent run.

Five supplemental regressions passed: health200/ok before; readiness200/dbconnected; signed-out session401/AUTH_REQUIRED; malformed JSON400/BAD_REQUEST; health200/ok after. Command: `node --test supplemental.test.mjs`. Actual5passed/0failed/0skipped. Total7checks is not seven complete UAT cases and not a full repository suite. `result.json` and the two output logs contain exact actual bodies/times/counts.

The first harness preflight expected the rendered footer in SPA bootstrap HTML, found no marker, and stopped before API tests. This tooling assumption is preserved in initial-bootstrap-marker-not-rendered.json. The harness was corrected to inspect a bounded same-origin SPA bundle; browser rendering separately verified the footer. No application assertion was weakened.

The captured `run-retest.mjs` retains original local sibling paths for provenance and is not a portable one-command package. To inspect/repeat the two standalone test files, use Node with node:test and the original fixed Workflow origin in their source; coordinate a fresh release/start before a future live repeat. Do not rerun against an unverified deployment. Whole-product acceptance, remaining additional coverage and actual peer contributions remain pending.

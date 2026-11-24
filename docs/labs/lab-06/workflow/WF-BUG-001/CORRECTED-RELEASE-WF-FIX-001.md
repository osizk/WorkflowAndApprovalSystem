# Corrected Workflow release WF-FIX-001

Verified 24 November 2026, Asia/Bangkok. Later update: ClassPulse A's independent retest at 23:03:13–15 Bangkok passed (2 original boundary tests plus five supplemental checks). WF-BUG-001 is closed as fixed/independently verified. See [disposition](INDEPENDENT-RETEST-DISPOSITION.md). Whole-product acceptance remains pending.

| Field | Verified value |
|---|---|
| URL | https://scd928edd-4d7hbszvwq-as.a.run.app/login |
| Full source commit | ad2cbef67decf9953219694898327dea0bb66034 |
| Visible browser marker | ad2cbef67dec |
| Serving revision | scd928edd-00008-9zd |
| Image digest | sha256:26459db1d0278afcac49ec298c2c7d0523c7fc6eef75eeb40e7f18561e34ca43 |
| Traffic | 100% to scd928edd-00008-9zd; no other revision has allocated traffic in the readback |
| Cloud mapping completed | 22:37:46.488 Asia/Bangkok / 15:37:46.488 UTC |
| Browser marker observed | 22:38:00.626 Asia/Bangkok / 15:38:00.626 UTC |
| Deployment run | https://github.com/osizk/WorkflowAndApprovalSystem/actions/runs/45426749596 |
| Release PR | https://github.com/osizk/WorkflowAndApprovalSystem/pull/64 |

Fresh read-only Cloud Run service/revision and Artifact Registry queries matched the serving image digest to the full source-commit image tag. A fresh isolated signed-out browser page displayed the new release marker. Detailed start/end times and raw sanitized readbacks are in corrected-serving-version.json and corrected-browser-marker.json.

## Validation

Main deployment CI passed 17 tests, with 0 failed and 0 skipped, and built Docker. Deployment-checks, the migration/release job and required public smoke checks passed. The optional signed-in smoke check was not configured.

Seven subsequent Product Team developer checks passed: health, database readiness, signed-out session denial, the 102400-byte control returning 422 VALIDATION_ERROR, the 102401-byte request returning 413 PAYLOAD_TOO_LARGE, malformed JSON retaining 400 BAD_REQUEST, and health after rejected bodies. These are developer verification results. They do not constitute the independent ClassPulse retest.

## Preservation and partner next step

The two-file release contains no schema or seed change. It uses the existing database; SEED_DEMO_DATA was false. No request cleanup, database reset, fixture provisioning or accepted terminal decision was performed during release verification. The supplied A/B request registry is retained. Fresh authenticated readback of each A/B record was not part of the public smoke verification; keep those records for partner comparison.

The original request below was fulfilled by the accepted independent retest. For a separately agreed future repeat, independently run WF-BUG-001 on a newly confirmed release, recording WF-FIX-001, the full commit and revision, actual byte counts, HTTP statuses/envelopes, timestamps and evidence. Preserve the original failure and add the retest as a separate result. Continue remaining agreed cases using the current release record and distinguish them from original-release results. Reconfirm the serving mapping if deployment or traffic changes.

The original-release UAT-06 at 21:57:46.326 retains the qualified provenance described in EN037-B-V2-DISPOSITION.md. It must not be relabelled as a corrected-release result.

# EN037 review of ClassPulse B v2

24 November 2026, Asia/Bangkok. Product Team technical disposition under Thira's delegated review. The incoming package and its attribution are retained unchanged.

## Evidence and counts

The incoming ZIP SHA256 is b6b04d0a2d81dfb000d2bb684ba7db5c2e0d47a355db84d961d8864500bb5309. All eight manifest entries verified. observations.json contains 48 timestamped observations, not 48 cases. The later UAT-06 console screenshot and corrected execution-time addendum are separate evidence. Both supplied images were visually reviewed.

## Browser setup

Accept the same temporary tab with explicit logout between roles as a documented setup variation for the observed UAT-02 amount and UAT-03 access paths. The raw role-specific views, denied direct-detail views, original-owner readback and final signed-out page support those observations. Reusing the tab does not itself invalidate these amount and account-access checks.

This does not establish a new private context, cookie isolation, expired-session handling or old-cookie replay rejection. No literal private-window repeat is required solely for these scoped observations. The UAT-04 persistence setup remains the separately documented A3 disposition. Retain the actual method in every result.

## Amount formatting

Accept 1000000.00 THB as the numeric maximum with two decimal places. The SRS BR-09 and F-02 contract require the inclusive amount boundary and exact two-place amount; they do not require a thousands-separator UI style. The 1,000,000.00 example in the handoff illustrates that numeric value. This addendum clarifies the example and accepts the ungrouped presentation. Preserve the original wording and observed display in the evidence. No product defect is identified solely from this separator difference.

UAT-02's observed UI boundary path is accepted with that presentation clarification. Backend status codes are not inferred from UI validation.

## UAT-03 access

Accept the observed list exclusion, denied unrelated direct-detail views without details/history/controls, and unchanged original-owner readback for d27f11e6-a057-4a1f-b190-980688127c63. This is scoped UI access evidence. The unexecuted backend role/assignment/PUT additions remain separate.

## Later UAT-06

Use execution time 21:57:46.326 Asia/Bangkok (14:57:46.326Z), not the request's creation time. The screenshot visibly records POST 403/FORBIDDEN, before/after GET 200, amount 125.50, SUBMITTED, the same original SUBMITTED event and unchanged:true for 9b734a22-085a-4f7f-a33f-3fe475c96012. Accept this one observed requester-decision denial path with the stated capture limits. The prepared probe guards REQUESTER before issuing the attempt, but the screenshot's identity object is collapsed. The screenshot also lacks a fresh visible footer marker. Neither is described as directly expanded/visible evidence.

The applicable recorded release basis is original source 82a4806b5291b57ad7e76a28fb7d40e1e947b9a6, marker 82a4806b5291, revision scd928edd-00007-477, digest sha256:6554d7f8cccdf1b4ded95f3f7d1a2560a786b0ecf7613cab62d59d942613a4fb, 100% traffic. This is supported by the 20:51:51–58 EN037 source-tag/digest mapping, B's matching markers through 21:34:37, and EN037's pre-deployment readback at 22:32:33–37 showing the same generation 7, revision, digest and traffic. These bracket the later attempt and support its original-release attribution. The pre-deployment service reports its last Ready/RoutesReady transitions on 21 November. This is corroborating release provenance; it is not a fresh marker or identity capture at 21:57:46.

No repeat is required solely for the missing expanded identity/marker in this one original-release observation. Preserve those limitations. A later repeat on the corrected deployment is new evidence and must identify that new version.

## Additional coverage and fixture status

Accept the supplied ADD-02 and ADD-03 evidence as supplemental UI observations only. ADD-02 API-only ownership/status-key probes, ADD-04 and ADD-05 remain NOT RUN. ADD-03 APPROVE with 501 characters remains incomplete because its immediate capture shows Saving decision; rerun that subcase with a completed outcome and preserved state. No HTTP 422 is inferred from UI-only evidence.

The sender's newer update supersedes the package's older C3-pending paragraph: A reports C3 posted on Issue #80 and contract approval. This records that report; executable provisioning, target-specific execution, fixture readiness and account access are not established. CD-07 third respondent and CD-01 inactive-account branches remain pending actual setup evidence and private access. No provisioner or embedded console instruction was executed during this package review.

## Retention and acceptance

Preserve all A/B synthetic requests, including the two A records and the B minimum, maximum, access, UAT-06 and reason-boundary records. No test-record cleanup is authorized by this disposition. The release contains no schema or seed change.

These technical dispositions do not sign the partner's whole-product acceptance or supply unperformed cases. Corrected-live independent WF-BUG-001 retest and final acceptance remain pending the new serving record and actual partner execution.

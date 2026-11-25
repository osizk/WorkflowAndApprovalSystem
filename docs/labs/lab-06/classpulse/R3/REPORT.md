# ClassPulse CP-V01 baseline follow-up (R3)

Run `UAT6-20261125-CodexD-R3`, 25 November 2026, 21:39–21:44 Asia/Bangkok. Actual operator and model were Codex (GPT-6) under Thira (D). Start notice was sent and verified at 21:39 in the agreed private Discord channel with ClassPulse A. Ashira's C review is a separate contribution and is pending.

## Release

CP-V01 source `1fe3e3b82dfb0537be30223c9b598b3479b4affe`, revision `classpulse-00006-6w6`, 100% traffic, digest `sha256:60f61ccccbc559e6c060383ad9acafc6918e1202ec1e7e5e43aa107c35707795`. ClassPulse A read revision, digest, traffic and eight-hour TTL in Cloud Console at 21:15:48 Bangkok. A carried forward the verified source mapping for the same immutable digest. The operator independently observed the live origin, asset `/assets/index-Bi1ZvEdG.js` and health HTTP 200 at 21:37:53 before the run and 21:43:56 after it. Exact cloud attribution comes from A's mapping. [Sanitized timestamps and readbacks](results.json)

## Actual results

| Branch | Setup, expected and actual |
|---|---|
| CD-06 signed-out PUT and DELETE | **PASS.** An owner created and published dedicated identified CPE334 survey **27** through the UI. An enrolled respondent submitted **4 / Online** through the UI, creating response **16**. Before the probes, response and owner summary readbacks were HTTP 200 with count 1 and average 4.00. In a separate signed-out context, identity returned 401. PUT with an empty JSON object at 21:43:39 and DELETE at 21:43:40 both returned the expected **401 UNAUTHENTICATED**. Both authenticated readbacks again returned 200 with exactly the same saved answers, submission timestamp, count, average, distribution and choice totals. The new evidence records are retained. |
| UAT-07 respondent reload | **PASS.** An active synthetic respondent signed in through the UI. At 21:39:43, identity returned **200**, the matching respondent identity and `RESPONDENT`, with the browser on `/surveys` (Available surveys). Reload at 21:39 preserved all three. Normal logout at 21:40:03 returned **204**, redirected to sign-in and gave **401 UNAUTHENTICATED** from identity afterward. |
| CD-01 live cookie attributes | **PASS.** A dedicated synthetic respondent login over HTTPS and normal logout returned **200** and **204**. At 21:41:46, the status-only evidence recorded HttpOnly, SameSite=Lax, Secure and path / on login and the logout cookie-clearing directive. Expiry metadata was present. Cookie data stayed in the temporary process and the evidence contains attribute booleans. |
| CD-01 live previous-session rejection | **BLOCKED for live replay.** A cyber-safety policy constraint prevented the assistant from re-presenting a revoked session credential to the deployed ClassPulse service. R3 observed ordinary logout and signed-out denial. The earlier verbose isolated CP-V01 **TEST-04 PASS** provides supporting evidence only. The live coverage limit is pending agreement by C and ClassPulse A/B. [Local TEST-04 output](../CP-V01-TEST-05/auth-test-output.txt) |

The run's business writes were limited to survey 27 and response 16. Survey 26, responses 13–15, existing users and enrollments were preserved. The owner read back survey 26 at HTTP 200, count 3 and average 4.33. Final cleanup logged both test browser sessions out, with HTTP 204 logout and 401 identity. No genuine ClassPulse product defect was observed in the executed branches.

## Accepted limits and next decision

- Natural eight-hour independent live expiry remains **OPEN**. Isolated TEST-05 remains **supporting PASS**. The live cookie expiry attribute is metadata.
- Production storage and complete log inspection remain **unobserved**. The local auth suite excludes password TEST-06. The password suite was outside this run.
- The additional rounding-tie check remains **NOT RUN**. Survey 26 already covers the required 4/4/5 example. Exact concurrency scheduling remains outside observation, with the existing external duplicate-result evidence retained.
- ClassPulse and C should review these results and the blocked previous-session check before agreeing on a separate blind staging window. Part D and final acceptance remain pending. Workflow WF-BUG-001 and its whole-product disposition remain separate.

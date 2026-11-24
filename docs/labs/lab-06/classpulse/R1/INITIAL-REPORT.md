> Historical initial execution checkpoint. CONTINUATION-REPORT.md supersedes account-blocked statuses; CD08-missing-ID-result.json supersedes the later missing-ID dependency. Current remaining work is in ../../STATUS.md.

# ClassPulse R1 execution report

See LAB-6-AI-USE-AND-CONTRIBUTIONS.md for the required AI-use and contribution declaration.
Prepared 24 November 2026. Final peer review and acceptance remain pending.

Run ID UAT6-20261124-CodexD-R1. Original survey title UAT6-20261124-1732-CodexD-01. Execution began around 17:31 and continued through 17:40 Asia/Bangkok UTC+7. Individual API timestamps are saved in final-results.json. UI observations are retained as accessibility snapshots with the execution sequence.

Target https://classpulse-zdwglar6eq-as.a.run.app/

Version basis CP-V01 as reconfirmed by the Product Team at 02:16:41 UTC+7, source 1fe3e3b82dfb0537be30223c9b598b3479b4affe, revision classpulse-00006-6w6, 100 percent traffic. This cloud mapping is partner-reported. No later deployment change was reported in this chat. Full source/digest details are in R02 and the A1 reply.

## Scope and test method

A's accepted/clarified case definitions were used for the available added probes. ClassPulse B review and final mutual inventory acknowledgement remain pending in their response. The report records actual observations and their scope limitations.

The owner and respondent used separate isolated browser sessions with the supplied authorized synthetic accounts. The normal journey was executed through the live UI. Additional backend checks used same-origin fetch. API-created fixtures are identified below. Browser response recorders and a MutationObserver captured response codes and the in-flight button state without logging cookies, passwords or headers.

## Original case outcomes

| Case | Whole-case outcome | Actual observation or remaining dependency |
|---|---|---|
| UAT-07 | PASS | Bad login showed Invalid email or password, /me returned 401. Correct Owner A login showed Dr. Ann Lee and OWNER, landed on /owner and survived reload. UI logout returned /login and /me returned 401. |
| UAT-01 | PASS | UI-created survey 6, questions 13/14, options 12/13. Draft then Published. Respondent 1 saw identified notice and submitted 4/Online. Response 3 persisted with timestamp. Submitted badge shown. Owner UI/API summary count 1, average 4.00, bucket 4=1, Online=1 and In person=0. No respondent identity or per-response rows in summary. |
| UAT-04 | PASS | One intentional repeat POST returned 409 ALREADY_RESPONDED. Saved response 3 remained 4/Online and owner count stayed 1. |
| UAT-08 | PASS for checked UI/API behavior | API setup created and published survey 7, with rating and A/B choice. UI/API showed count 0, null average rendered as an em dash, all-zero buckets/options, No responses yet, and no identity/response rows. Setup was through the API rather than the common UI setup instructions. |
| UAT-03 | PARTIAL, remaining steps BLOCKED | Respondent owner-detail and summary reads returned 403. Owner B reads/close require missing Owner B access. |
| UAT-09 | PARTIAL, remaining steps BLOCKED | Owner response read returned 403. Authenticated Respondent 1 PUT/DELETE returned 404; original answers/count unchanged. Cross-respondent read needs Respondent 2. |
| UAT-12 | PARTIAL, remaining steps BLOCKED | Respondent owner courses/list/create/publish/close returned 403. Owner respondent-detail/submission returned 403. Signed-out representative requests returned 401. Cross-course/other-owner checks need Owner B. |
| UAT-02 | NOT RUN, access dependency | Full supplied case names Respondent 2 and requires two different successful responses. |
| UAT-05 | NOT RUN, access and sequence dependency | Preserve S1 Published until all required pre-close cases can finish. Respondent 2 required for new-response denial. |
| UAT-06 | NOT RUN, access dependency | Needs Respondent 3, the non-enrolled account. |
| UAT-10 | NOT RUN, sequence/access dependency | S1 must first be Closed by UAT-05; supplied case also names Respondent 2. |
| UAT-11 | NOT RUN, access dependency | Requires two different enrolled respondents. |

The first UAT-01 attempt produced a correct required-rating error because the automation clicked the visually hidden input without actually selecting it. Inspection confirmed unchecked state. Activating its associated label selected rating 4, after which the valid submission succeeded. This was an operator/tool issue. It is preserved in the log and is not reported as an application defect.

## Additional case observations

| Case | Result | Detail |
|---|---|---|
| UAT-CD-01 core | PASS for executed probes; full case PARTIAL | Eight invalid-login variants produced the expected generic 401 or field-validation 400; /me returned 401 after each. Includes five JSON shapes and raw text/plain. A unique synthetic unknown email was selected for the probe; concurrence on that exact candidate is pending. Inactive-account and controlled session evidence remain unavailable. |
| UAT-CD-02 | PASS for 30 API probes and recorded readbacks | Exact title/prompt/question-count/option/description limits and malformed course IDs returned the expected 201/400. Ten successful DRAFT records retained as IDs 8–17. List inventories were checked after each request and later saved-detail measurements were read back. |
| UAT-CD-03 | PASS for executed external checks | Survey 18. Six invalid answer shapes each returned 400, respondent stayed unsubmitted and owner count stayed 0. A final valid response returned 201, response 5, count 1 and 4/Online. |
| UAT-CD-04 | PASS for external competing-call probe | Survey 19. Exactly two concurrent calls returned 201 and 409. Response 6 read back as 4/Online, count 1. Exact database interleaving was not observed. |
| UAT-CD-05 | PASS for both observed branches | Survey 20 was closed with a filled respondent form still open. Submit returned 409 SURVEY_NOT_OPEN with visible UI message and owner count 0. Separate survey 21 double-click produced one observed 201, response 8 and count 1. MutationObserver captured disabled=true with Submitting text while in flight. No throttling was needed. |
| UAT-CD-06 | PASS for executed route matrix and external readbacks | All thirteen protected GET/POST calls returned 401 UNAUTHENTICATED with only error at top level. Enrolled respondent GET /api/surveys/not-a-number returned 404. Owner readbacks showed S1 Published/count 1 and no denied-create record. |
| UAT-CD-07 | NOT RUN, fixture dependency | Third authorized enrolled respondent unavailable. |
| UAT-CD-08 | NOT RUN, fixture/access dependency | Respondent 2/3 and verified missing-ID procedure unavailable. |

No ClassPulse application defect was established in these completed observations. Remaining unexecuted branches prevent a comprehensive no-defect conclusion or final acceptance decision.

## Data retained

| Survey | Purpose | State at checkpoint |
|---|---|---|
| 6 | Original S1 | Published, count 1, response 3 |
| 7 | Empty summary | Published, count 0 |
| 8–17 | Successful authoring boundaries | Draft |
| 18 | Malformed answer checks | Published, count 1, response 5 |
| 19 | Concurrent pair | Published, count 1, response 6 |
| 20 | Stale form | Closed, count 0 |
| 21 | In-flight/double-click | Published, count 1, response 8 |

Original pre-existing surveys were not used for mutation. Negative PUT/DELETE probes targeted only this run's response 3 and were rejected. Records remain retained under the supplied handoff's retention rules.

## Evidence and status

- final-results.json is the current complete machine-readable log. Earlier execution-log.json and results.json are checkpoints.
- 01-form.png captures the identified form before answer entry.
- 01-confirmation.png captures the saved response.
- 01-summary.png captures the populated owner summary.
- 08-empty-summary.png captures the empty state.
- CD05-stale-denial.png captures the visible stale-form error.
- Corresponding base64 files are retained as transport artifacts for the screenshots.

All screenshots are from the actual application. No passwords or cookie values are included. Logs show actual observed response bodies and IDs. Field/string-generation definitions for the authoring matrix are in the R11 revision 2 case text and execution tool record.

## Next dependency

Obtain authorized private access for Owner B, Respondent 2 and Respondent 3. Confirm the inactive/third-respondent/missing-ID fixtures and actual partner peer-review state. Continue remaining S1 cases before closing it. Preserve these initial observations separately from later runs/retests. Final R07 acceptance remains pending.

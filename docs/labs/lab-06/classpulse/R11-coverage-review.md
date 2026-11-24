> Coverage proposal history. Read STATUS.md and the execution records for subsequent agreements and completed branches.

# R11 Independent coverage review of ClassPulse

Draft for Thira Rungruangkaset (D, 67070503419) and Ashira Sansoda (C, 67070503445).
Prepared with Codex on 24 November 2026. Student review and Product Team agreement are pending. This records document analysis. All cases remain NOT RUN.

Revision 2 corrects the preparation draft against all four complete feature contracts at the CP-V01 source commit. Proposed additions remain subject to student review and agreement with ClassPulse.

## Review basis

Supplied ClassPulse_Lab6_CD_Handoff_v2_1.zip, handoff.md UAT-01–12, contract-extracts.md AC-01–34, coverage.md and instructor-clarification.md. Independently read F-01 authentication, F-03 survey authoring, F-04 response submission and F-05 summary contracts plus PROTECTED_ROUTES from GitHub at source commit 1fe3e3b82dfb0537be30223c9b598b3479b4affe. This review verifies the written contract requirements. Serving behavior and cloud metadata have not been independently tested.

Pinned sources

- [F-01 authentication](https://github.com/Punge089/classpulse/blob/1fe3e3b82dfb0537be30223c9b598b3479b4affe/docs/sprints/sprint-1/F-01-authentication.md)
- [F-03 survey authoring](https://github.com/Punge089/classpulse/blob/1fe3e3b82dfb0537be30223c9b598b3479b4affe/docs/sprints/sprint-1/F-03-survey-authoring.md)
- [F-04 response submission](https://github.com/Punge089/classpulse/blob/1fe3e3b82dfb0537be30223c9b598b3479b4affe/docs/sprints/sprint-1/F-04-response-submission.md)
- [F-05 aggregate summary](https://github.com/Punge089/classpulse/blob/1fe3e3b82dfb0537be30223c9b598b3479b4affe/docs/sprints/sprint-1/F-05-aggregate-summary.md)
- [Protected route inventory](https://github.com/Punge089/classpulse/blob/1fe3e3b82dfb0537be30223c9b598b3479b4affe/server/tests/api/unauthenticated.test.ts)

Use CP-V01 as reported by ClassPulse, verified by their team at 00:58–00:59 Asia/Bangkok on 24 November 2026.
URL https://classpulse-zdwglar6eq-as.a.run.app/
Source 1fe3e3b82dfb0537be30223c9b598b3479b4affe
Revision classpulse-00006-6w6, reported traffic 100%.
Digest sha256:60f61ccccbc559e6c060383ad9acafc6918e1202ec1e7e5e43aa107c35707795
Protected baseline d4bad74211729032697164f378638efb834a67b6.
Reconfirm if deployment or traffic changes. Developer preflight results are supporting evidence only.

## Coverage assessment

Covered means the proposed steps address the named behavior. It does not mean the behavior passed.

| Requirement branch | Supplied cases | Assessment and reason |
|---|---|---|
| AC-01–04 and AC-08 authentication | 07, 01, 12 | Partial. Wrong password, identity, reload and UI logout covered. Unknown email, malformed login, cookie properties and old-session invalidation need extra checks or disclosed supporting evidence. |
| AC-05–06 expiry and credential storage | none directly | Missing independent coverage. Ask for a controlled expiry method and sanitized developer evidence for storage/log protection. |
| AC-07 signed-out route protection | 12 | Partial. Four GET checks omit protected writes and several reads. |
| AC-09 invalid login payload | none | Missing. Add missing/non-string credential payloads and non-JSON content. |
| AC-10–13, AC-19 authoring/publish | 01, 02, 12 | Partial. Normal authoring and ownership precedence covered. Authoring limits and malformed course IDs need additional cases. |
| AC-14–15 lifecycle | 05, 10 | Covered by planned legal and illegal transitions and state readbacks. |
| AC-16–18, AC-32 owner role/ownership | 03, 12 | Covered for the documented owner-route operations when each subrequest is recorded. Verify exact route inventory against pinned contract. |
| AC-20–21, AC-23–24, AC-26–27, AC-29 respondent access/history | 01, 05, 06, 09, 10, 12 | Partial. Non-numeric survey IDs and the combined enrollment/status/validation error-precedence branches remain missing. Retain per-attempt protected-state readbacks. |
| AC-22 duplicates | 04 | Partial. Sequential repeat covered, simultaneous valid requests missing. |
| AC-25 answer validation | 02, 11 | Partial. Rating limits and optional omission covered. Missing choice with valid rating, foreign IDs, duplicates and malformed shapes remain. |
| AC-28 UI feedback | 01, 04 | Partial. Notice/confirmation/badge covered. In-flight disabled submission and stale-form closure missing. |
| AC-30 aggregate arithmetic | 01, 02, 11 | Partial. One/two-response arithmetic covered. Literal three-response 4.33 example needs a third authorized fixture or clearly attributed supporting evidence. |
| AC-31, AC-33–34 empty/populated summary and privacy | 01, 08, 11 | Covered by proposed API/UI observations. Include zero-count option order in actual checks. |

## Proposed additional cases

Each addition needs Product Team agreement before execution. Use dedicated surveys and fresh respondent/survey pairs. Preserve S1 at count 1. Record every materially different request separately with version, tester/operator, time, inputs/IDs, status/body, readback and evidence. On unexpected success stop the affected chain, preserve evidence and report it.

API templates use observed positive numeric course, survey, question, option and response IDs. Replace placeholders before sending. The base authoring body is {courseId: ownedCourseId, title: uniqueTitle, questions: [{prompt: 'Rate this class', type: 'RATING', required: true}]}. For answer tests use a dedicated survey with required RATING and SINGLE_CHOICE questions, options Online and In person. Its valid body is {answers: [{questionId: ratingQuestionId, ratingValue: 4}, {questionId: choiceQuestionId, optionId: onlineOptionId}]}. Change only the field named by each subcase.

Owner list/count and respondent readbacks establish externally observable state. They cannot independently establish database-row absence or atomicity. Attribute database assertions to supporting developer evidence when needed. Retain all synthetic records and before/after observations.

### UAT-CD-01 Authentication invalid inputs
References AC-02, AC-03, AC-09.
Preconditions Fresh signed-out session and agreed nonexistent synthetic email. Endpoint POST /api/auth/login takes {email, password}. Use the synthetic Owner A email and privately supplied password. An inactive-account probe depends on an authorized existing fixture.
1. Reuse the wrong-password observation from UAT-07 and submit the nonexistent email with a synthetic password. Compare status/code/message without capturing passwords. Run the wrong-password probe again only if the earlier response was not recorded for this release.
2. As distinct login requests send {}, {email: ownerEmail}, {password: syntheticPassword}, {email: 123, password: syntheticPassword}, and {email: ownerEmail, password: 123}. Also send raw text 'not-json' with Content-Type text/plain.
3. After each attempt call /api/auth/me.
Expected Step 1 returns the same 401 INVALID_CREDENTIALS outcome. Step 2 returns 400 VALIDATION_ERROR, with a details entry for each bad field in JSON inputs. Each /me returns 401 and no usable session exists. An inactive-account probe must return the same 401. Record that probe as dependent on the agreed fixture until access is available. Capture cookie names/attributes only if checking cookie creation and redact values. Session-row counts require supporting evidence from an isolated developer test.

### UAT-CD-02 Authoring limits and course IDs
References AC-11–12.
Preconditions Owner A, owned CPE334 ID and the base authoring body. Record initial owned survey IDs/count. All probes use POST /api/owner/surveys.
1. Use title strings 'T', 'T'.repeat(120), 'T'.repeat(121) and three spaces as separate inputs. The first two are valid, the others invalid. For exact-length probes record run ID in the prompt and execution record instead of prefixing the title. Create fresh records for valid inputs.
2. Send questions arrays of lengths 0, 1, 20 and 21. Each included question is a valid RATING with prompt 'Question '+position. Expected valid lengths are 1 and 20.
3. Test prompt 'P', 'P'.repeat(300), 'P'.repeat(301) and three spaces. Expected valid lengths are 1 and 300. Record run ID in title for these probes.
4. Use SINGLE_CHOICE with distinct options generated as 'Option '+position at counts 1, 2, 6 and 7. Expected valid counts are 2 and 6. Separately test ['A','B'.repeat(100)] (valid), ['A','B'.repeat(101)] (invalid), ['A','   '] (invalid) and ['Online',' online '] (invalid duplicate after trimming and case folding).
5. As separate invalid inputs send type 'TEXT', required 'true' as a string, questions as an object, and a RATING with nonempty options ['A','B']. Separately test description lengths 1000 (valid) and 1001 (invalid).
6. Send courseId 'abc', 0, -1 and 1.5 as separate inputs with otherwise valid bodies.
Expected Valid bodies return 201 and saved DRAFT surveys with the expected questions/options. Invalid bodies return 400 VALIDATION_ERROR naming the relevant field and create no visible survey. Re-read authorized survey lists after each attempt, matching recorded IDs for valid cases. Keep the successful boundary surveys as synthetic evidence. These subcases address important authoring branches; exhaustive type permutations remain supporting developer-test coverage.

### UAT-CD-03 Answer structure and choice validation
References AC-25.
Preconditions Dedicated published two-required-question survey, fresh eligible respondent, actual question/option IDs plus authorized IDs from a separate survey. Count starts at 0.
1. Submit valid rating with required SINGLE_CHOICE omitted.
2. As separate invalid bodies send the valid body with the rating question ID replaced by a question ID from a different survey; the choice option replaced by an option from that other survey's choice question; a second copy of the rating answer appended; answers changed to {}; and answers changed to [null]. All other fields stay valid where possible. Record actual foreign IDs and their authorized source survey. Each malformed payload can produce multiple field errors.
3. After each rejected request, Owner A checks responseCount stays 0 and all buckets/options stay 0; the respondent reloads the survey list and verifies it remains unsubmitted. These readbacks establish observable state. Database absence requires supporting evidence.
4. Finish with one valid answer to prove the eligible pair still works.
Expected Invalid inputs return 400 with field details, count stays 0 and no response is stored. Final valid input returns 201 and count becomes 1.

### UAT-CD-04 Concurrent duplicate protection
References AC-22.
Preconditions Dedicated published survey, one eligible respondent with no existing response and exact valid answer payload. Count starts at 0. Agree an exception to the original planned-repeat rule.
1. Dispatch two identical valid requests concurrently in the same authorized session with Promise.all([cpUat('/api/surveys/'+surveyId+'/responses','POST',validBody), cpUat('/api/surveys/'+surveyId+'/responses','POST',validBody)]). Save each labeled response. Promise.all starts both calls together without establishing their exact server-side overlap; repeat a separate round with fresh data if a request was blocked or never dispatched.
2. Record both responses separately.
3. Retrieve the successful saved response and owner summary.
Expected Exactly one 201 and one 409 ALREADY_RESPONDED. Exactly one saved response, count 1 and unchanged expected answers. Use fresh data for reruns.

### UAT-CD-05 Form open while survey closes
References AC-23, AC-28.
Preconditions Dedicated published survey with no responses; respondent form open with valid answers; separate owner session.
1. Owner closes survey while respondent leaves the form open.
2. Respondent submits the stale form.
3. Observe error and verify owner count remains 0.
4. On another fresh published survey, fill valid answers and attempt a rapid double-click on Submit. Observe the button during the request and record request count, confirmation ID and owner count afterward. Use browser network throttling if needed and restore it afterward. If the in-flight state cannot be observed, record that subcase as BLOCKED.
Expected Closed submission returns 409 SURVEY_NOT_OPEN and clear UI feedback with no stored response. Submit is disabled during the valid request; one accepted action stores one response. Record both API and visible outcomes.

### UAT-CD-06 Remaining signed-out routes and malformed survey ID
References AC-07, AC-29.
Preconditions Use the thirteen GET/POST entries in the pinned PROTECTED_ROUTES inventory. UAT-12 already checks GET /api/auth/me, GET /api/owner/surveys, GET /api/surveys and GET /api/responses/<responseId>. Reference those execution records. Use dedicated synthetic IDs for the remaining probes.
1. While signed out, send each of the nine remaining calls separately: POST /api/auth/logout; GET /api/owner/courses; POST /api/owner/surveys; GET /api/owner/surveys/<surveyId>; POST /api/owner/surveys/<surveyId>/publish; POST /api/owner/surveys/<surveyId>/close; GET /api/owner/surveys/<surveyId>/summary; GET /api/surveys/<surveyId>; POST /api/surveys/<surveyId>/responses. Use valid create/answer bodies and omit bodies for the other calls.
2. Use authorized readbacks after write attempts.
3. As eligible respondent, request a non-numeric survey ID.
Expected Protected calls return 401 UNAUTHENTICATED with only error at the JSON top level and no observable writes. Non-numeric detail /api/surveys/not-a-number returns 404 NOT_FOUND.
The supplied cpUat helper blocks non-numeric paths and auth POST. Agree a narrowly scoped helper extension or direct same-origin fetch with sanitized output for these cases. The feature contract's absent PUT/DELETE routes have a potentially ambiguous anonymous-status description, so this thirteen-route assessment uses the explicit PROTECTED_ROUTES list and leaves that discrepancy for clarification.

### UAT-CD-07 Exact aggregate example
References AC-30, AC-33.
Preconditions A/B supplies a fixture with three authorized respondents enrolled in the same course, with a dedicated survey containing a required rating plus choice options Online/In person. Provisioning depends on A/B. Until the fixture is available this addition remains pending agreement. C/D retain existing live enrollments and data.
1. Three eligible synthetic respondents submit ratings 4, 4 and 5, each choosing Online once, to the dedicated survey.
2. Owner retrieves UI/JSON summary.
Expected Count 3, average 4.33, buckets 4=2 and 5=1, others 0; Online=3 and In person=0 in original option order, with no identity/per-response data.
If fixture unavailable, retain this as a disclosed gap and reference supporting automated evidence explicitly. Do not label it independent PASS.

### UAT-CD-08 Response error precedence
References F-04 section 3, AC-23–25 and AC-29.
Preconditions Dedicated fresh DRAFT survey in CPE334, actual question IDs and valid answer body. Respondent 3 is enrolled only in CPE231; Respondent 2 is enrolled in CPE334. Use a separately created CLOSED CPE334 survey with count 0 for the second branch. A/B provides a verified nonexistent positive survey ID for the last branch.
1. As Respondent 3 submit the valid body to the DRAFT survey. Expect 403 NOT_ELIGIBLE, which is checked before status.
2. As Respondent 2 submit {answers:[]} to the CLOSED survey. Expect 409 SURVEY_NOT_OPEN, which is checked before required-answer validation.
3. As Respondent 2 submit {answers:[]} to the verified nonexistent survey ID. Expect 404 NOT_FOUND.
4. After each attempt Owner A rereads existing survey status/summary and confirms DRAFT/CLOSED status and count 0 are preserved. Check the respondent list for absence of a new saved submission.
Record each request/status/body/readback as a separate subcase. These checks strengthen the supplied UAT-05/06/10 cases by combining invalid conditions and verifying their documented precedence.

## Coordination and outstanding clarifications

- Actual initial/retest appointment times and private findings channel remain PENDING. C/D availability is 24–29 November 2026 Asia/Bangkok.
- Product Team full names/IDs and private account access confirmation remain to be completed.
- Proposed division for student agreement: D leads supplied 07,01,04,05,10 and additions CD-01,CD-04,CD-05. C leads supplied 02,03,06,08,09,11,12 and additions CD-02,CD-03,CD-06,CD-08. Assign fixture-dependent CD-07 jointly after setup is agreed. Split CD-02's longer matrix further if needed. Both students review each other's records. This allocation records a proposal. Actual participation and operators must be recorded during execution.
- Exchange run ID and exact S1 IDs before dependent checks. Preserve ordering and prevent extra valid answers on S1.
- Agree helper extensions, title-prefix exception, controlled fixtures and exact invalid payloads.
- Complete pinned contracts were checked for this revision. Record any agreed inventory changes without changing the contracted expected behavior.
- Ask for safe evidence/methods for session expiry, old-session invalidation, cookie flags and persistence across application restart. Do not collect raw tokens or require access to infrastructure.
- The handoff has older TA-assigned no-defect wording. Its addendum describes a later instructor clarification. Confirm the applicable announcement with the students before any controlled exercise. No exercise is needed to finish preparation.
- Record updated deadline when confirmed. Availability through 29 November is not a verified course deadline.

## Product Team disposition and inventory freeze

For each UAT-CD case record accepted / revised / clarification needed, exact scope, reason, responder and time.

| Proposed case | Product Team response | Reason or revised scope | Responder and time | Final required subcases |
|---|---|---|---|---|
| UAT-CD-01 | PENDING | PENDING | PENDING | PENDING |
| UAT-CD-02 | PENDING | PENDING | PENDING | PENDING |
| UAT-CD-03 | PENDING | PENDING | PENDING | PENDING |
| UAT-CD-04 | PENDING | PENDING | PENDING | PENDING |
| UAT-CD-05 | PENDING | PENDING | PENDING | PENDING |
| UAT-CD-06 | PENDING | PENDING | PENDING | PENDING |
| UAT-CD-07 | PENDING fixture | PENDING | PENDING | PENDING |
| UAT-CD-08 | PENDING | PENDING | PENDING | PENDING |

Final inventory version PENDING. Keep original UAT-01–12 IDs and agreed added IDs stable.
All execution results, findings, retests and acceptance remain NOT RUN or PENDING as applicable.

# Lab 6 plan from preparation to submission

Latest independent-retest checkpoint: ClassPulse A independently retested WF-BUG-001 on WF-FIX-001 at 23:03:13.097–23:03:15.462 Bangkok on 24 November. The unchanged original reproducer passed 2/2 (102400 bytes -> 422; 102401 bytes -> 413), and five supplemental checks passed. All 25 package hashes verified. WF-BUG-001 is fixed and independently verified, closed as completed. This is scoped defect closure; remaining agreed Workflow coverage, whole-product acceptance and ClassPulse CD-01/CD-07 fixtures remain pending. See [independent retest disposition](workflow/WF-BUG-001/INDEPENDENT-RETEST-DISPOSITION.md).

Working plan for Thira Rungruangkaset and Ashira Sansoda, prepared on 24 November 2026, Asia/Bangkok UTC+7.

This is the end-to-end working plan. Update status and evidence references as work actually happens. Execution, communication and acceptance records reflect actual actions and retain their limitations.

Current checkpoint after corrected deployment on 24 November: original ClassPulse UAT-01–12 behavior observations and agreed CD-08 checks are recorded; fixture-dependent CD-01/CD-07 branches remain pending. Workflow WF-BUG-001 was independently reproduced, corrected with meaningful RED/GREEN and peer-approved PRs #63/#64, and deployed as WF-FIX-001 (source ad2cbef67decf9953219694898327dea0bb66034). Seven developer checks passed on the corrected release. ClassPulse independent corrected-live retest is now accepted PASS and the finding closed. Remaining agreed coverage, final acceptance and the submission PDF remain pending. LAB-6-CURRENT-STATUS.md contains the latest checkpoint; the initial preparation snapshot below is retained as history.

Branch policy: use the shared lab6 branch for Lab 6 integration. Open working branches named codex/lab6-* from lab6 and target lab6 in their PRs. Run review and CI there. Release reviewed changes from lab6 into main only after coordinating the deployment window. main remains the deployment branch. Earlier PRs #63/#64 used the prior staging route before this policy was requested; their deployed evidence remains preserved.

## 1 People and the two directions of work

| Team | People | Product they own | Product they independently test |
|---|---|---|---|
| Our team EN-037_P5 | D Thira Rungruangkaset, 67070503419, HolyThiccDaddy. C Ashira Sansoda, 67070503445, osizk. | Workflow and Approval System | ClassPulse |
| Partner team A/B | A Bannasorn Thongkorn, 67070503420, Punge089. B Papangkorn Jitvoottikrai, 67070503421, book6349. Identities supplied in partner correspondence; retain any outstanding direct confirmation. | ClassPulse | Workflow and Approval System |

For Workflow, we prepare the handoff, receive findings, fix accepted defects and provide corrected releases. ClassPulse executes independent tests and decides whether Workflow is accepted.

For ClassPulse, we review their cases, execute independent tests, report findings, retest their corrections and decide whether ClassPulse is accepted.

TokTickIT supplies earlier individual-lab background. Workflow is our shared project for Lab 6.

## 2 Goal and completion conditions

Submit one self-contained PDF for our team covering both directions of work and all four assessed parts.

| Part | Points | What our PDF must establish |
|---|---|---|
| A Preparation and handoff | 20 | Our delivered Workflow Sprint 1 scope has executable UAT cases, requirement references, version information, accounts, setup and retention instructions usable by ClassPulse. |
| B Independent execution | 25 | We independently execute the agreed ClassPulse cases, including agreed additions, with actual results and evidence from both students. |
| C Reporting and triage | 20 | We report findings on ClassPulse and give every finding received about Workflow a reasoned classification and disposition. |
| D Correction and independent retest | 35 | Accepted Workflow defects have the required correction evidence. ClassPulse independently retests our corrected release and records a final decision. Include our retest and decision for ClassPulse too. Follow the applicable controlled exercise process if needed. |

An Accepted decision requires the agreed scope to be tested, critical/major defects to be corrected and independently retested, and minor limitations to be fixed or explicitly accepted. A final Not Accepted outcome must be recorded honestly when those conditions remain unmet. A truthful submission may document unresolved dependencies.

Our available dates are 24–29 November 2026. Exact session times remain to be agreed. The exact current course deadline remains unconfirmed in this chat. The original PDF prints 22 November, the earlier LEB2 view showed 29 November, and ClassPulse reports an extension without an exact replacement date. Confirm the applicable deadline before scheduling the final submission.

## 3 Historical preparation checkpoint at the start of this plan

| Item | Current state | Next verification |
|---|---|---|
| Course source folder | D:/Downloads/Software Engineer KMUTT contains downloaded assessment/learning attachments and repository clones. | Refer to the labsheet and applicable instructor clarification. |
| Our Workflow handoff | Six cases UAT-01–06 prepared. Aligned copy saved in Downloads. | Students check the Word layout and confirm the exact file/version shared. Automated DOCX checks passed; visual rendering was unavailable. |
| Our app availability | Thira confirmed the URL is ready. | Record the currently serving source/revision/digest/traffic with verifier and time. |
| Workflow credentials | ClassPulse's supplied draft says it received private synthetic access. | Confirm actual receipt and usability with the partner. The draft alone does not establish a successful login. |
| ClassPulse pack | ClassPulse_Lab6_CD_Handoff_v2_1.zip reviewed. Contains original UAT-01–12 and R01–R12 templates. | Freeze the agreed original and additional inventory. |
| ClassPulse release | CP-V01 supplied by their team. | Reconfirm if deployment/traffic changes before a test session. |
| Our ClassPulse coverage review | R11 revision 2 prepared with eight proposed UAT-CD cases. Complete pinned feature contracts checked. | Thira/Ashira review and ClassPulse disposition/agreement pending. |
| Extra Workflow cases | ClassPulse proposed authentication, boundaries, reason limits, repeated/concurrent decisions, assignment/access, immutability and keyboard/mobile checks. | Obtain their precise cases and agree scope/setup. |
| Independent execution | No execution results recorded in this chat. | Start after scope, release and account setup are agreed. |
| Findings, fixes and acceptance | Pending actual execution. | Record real outcomes as they happen. |

### Initial product version register

Workflow URL https://scd928edd-4d7hbszvwq-as.a.run.app/login

Workflow repository https://github.com/osizk/WorkflowAndApprovalSystem

Workflow protected Sprint 1 baseline in the pack is 7c3f8a73f424dc8d5e1f27cb6ff38db8af562a8c. Proposed Lab 5 test commit is 82a4806b5291b57ad7e76a28fb7d40e1e947b9a6 with marker 82a4806b5291. Revision scd928edd-00007-477 is last recorded. Treat current serving mapping as pending until read back.

ClassPulse URL https://classpulse-zdwglar6eq-as.a.run.app/

ClassPulse repository https://github.com/Punge089/classpulse

CP-V01 was reported verified by ClassPulse on 24 November 2026 at 00:58–00:59 Asia/Bangkok.

- Source commit 1fe3e3b82dfb0537be30223c9b598b3479b4affe
- Cloud Run revision classpulse-00006-6w6
- Traffic 100 percent
- Image digest sha256:60f61ccccbc559e6c060383ad9acafc6918e1202ec1e7e5e43aa107c35707795
- Protected Sprint 1 baseline d4bad74211729032697164f378638efb834a67b6
- Their reported developer preflight passed 8/8. Independent results are still pending.

Preserve both baseline and tested release identifiers. Explain changes between them. Acceptance applies to the exact tested release and scope.

## 4 Stage one Confirm participants and coordination

1. Complete R01 with all four real names/IDs, team roles and both product names.
2. Agree exact initial, correction and retest slots within the available dates. Reserve time for PDF assembly before the confirmed deadline.
3. Agree one private findings channel and a person responsible for notifying the other team before deployment changes.
4. Confirm private synthetic-account access in both directions. Record account labels and roles in reports. Keep password/token values out of evidence and public files.
5. Confirm synthetic-data retention and how fresh data will be made for reruns. Retain original run records.
6. Record both products in R02, using the verified serving versions and confirmation sources.

Completion evidence is a reviewed R01 and version register with pending fields explicitly identified. Draft partner communications for student review. Send externally only when the user authorizes sending.

## 5 Stage two Review coverage and freeze both inventories

### Our review of ClassPulse

1. Review R11-ClassPulse-coverage-review-draft.md with Ashira.
2. Retain original UAT-01–12 IDs and their dependencies.
3. Present proposed additions UAT-CD-01–08 for discussion. They cover authentication input validation, authoring limits, malformed answers, concurrent duplicates, stale forms, remaining signed-out routes, the exact aggregate example and error precedence.
4. Record ClassPulse's disposition, reason, responder and time for each addition.
5. Resolve helper limitations and exact-title prefix exceptions before execution.
6. Agree the fixture-dependent aggregate case or explicitly document the remaining independent-coverage limit and attributed supporting evidence.
7. Freeze a versioned inventory with every required subcase, expected outcome and fixture dependency. Record any subsequently discovered gap and its agreed addition.

### ClassPulse's review of Workflow

1. Confirm they received the six-case file and the applicable Sprint 1 contract v0.6.
2. Obtain their detailed additional cases and independent coverage assessment.
3. Check each expected result against our delivered contract. Clarify setup for assignment-unavailable, expiry, rollback and restart checks.
4. Agree exact title/purpose/reason boundary inputs and a title-prefix exception where required.
5. Record dispositions and freeze the Workflow inventory they will execute.

At least four cases per product must cover a normal journey, business rule/boundary, forbidden role/ownership, and state/history/persistence. Additions address important gaps in the delivered scope. Treat developer-test evidence and independent user observations with their actual attribution.

Completion evidence is an R11 review per product, agreed case inventories and clear dispositions for setup limitations.

## 6 Stage three Prepare and rehearse handoffs

For Workflow, provide the current handoff, agreed additions, contract sections, URL/version, synthetic account labels and roles, setup, sequencing and retention instructions. Check that fresh synthetic records can be created and the requester-to-reviewer journey is usable. Record our own checks as product-team preflight.

For ClassPulse, obtain the release record and test access, and read their setup instructions. Reconfirm the served version if changes have occurred. Record a fresh run ID and allocate original and added cases between C and D. Each student reviews the other's records. The R11 allocation remains a proposal until the students agree.

Completion evidence is a usable handoff for each product and prepared blank R03 records. Expected results can be prefilled from cases. Actual observations and outcomes begin NOT RUN.

## 7 Stage four Execute initial independent UAT

### We test ClassPulse

1. Record actual tester, operator if AI assists, start time/timezone, CP-V01 or updated verified version and inventory version.
2. Create a fresh run ID and record actual survey/question/option/response IDs.
3. Follow the shared S1 sequence UAT-07,01,03,04,06,09,12,05,10. Coordinate both students on that sequence. Run independent UAT-02,08,11 with separate data.
4. Keep S1's intended count at one. Complete all required S1 probes before closing it in UAT-05.
5. Execute each agreed UAT-CD subcase with its dedicated fixtures. Preserve literal expected values for boundary cases.
6. Record each materially different request/subcase in R03 with real inputs, actions, expected and actual result, PASS/FAIL/BLOCKED and evidence ID. Keep NOT RUN until attempted.
7. Capture a normal UI journey and meaningful negative/access evidence. For denials capture the error and authorized unchanged-state/no-disclosure readback.
8. If an operation unexpectedly succeeds, preserve the observation and report it. Reassess dependent fixtures before continuing.
9. Register every actual finding in R04 and send through the agreed channel with user-authorized communication.

### ClassPulse tests Workflow

They execute the agreed Workflow inventory and record their own observations. We provide setup clarification and availability, receive findings, and notify them before affecting their session. Their independent results and acceptance must retain the actual tester attribution.

For every failed or blocked dependency, identify affected cases. Preserve original observations even if later corrected. Completion evidence includes the initial R03 records, R04 findings and R08 evidence index for the agreed inventory.

## 8 Stage five Report and triage every finding

For findings we discover on ClassPulse, include product/release, reporter, case and requirement, synthetic inputs and IDs, reproduction steps, expected/actual outcome, user impact, severity and readable evidence. Obtain their disposition and correction/retest plan.

For every finding received on Workflow, reproduce it and record R05 classification as accepted defect, duplicate, not-defect or enhancement. Give a reason linked to contract and evidence. Link duplicate reports to their original Issue. For accepted defects record severity, owner, status and disposition.

Critical/major findings block acceptance until corrected and independently retested. Minor findings require correction or explicit independent acceptance as limitations. If there are zero findings, record the actual zero-findings outcome after thorough testing and assess the controlled exercise requirement.

## 9 Stage six Correct our Workflow defects through the delivery process

For each accepted defect we correct, maintain the following traceable chain.

1. Create or link a reproducible Issue and affected requirement/case.
2. Branch from the appropriate sprint staging branch.
3. Write a meaningful regression test that reproduces the defect and fails against the defective implementation. Preserve actual RED output and exact commit.
4. Fix the implementation and demonstrate the same test passing. Preserve actual GREEN output and exact commit.
5. Run relevant existing regression checks and required build/CI checks. Record names, commands and passed/failed/skipped counts.
6. Obtain substantive teammate review of the correction PR and integrate through staging.
7. Use the reviewed release path into main and the Lab 5 pipeline. Record release SHA, CI run, deployment/revision/digest and smoke outcomes.
8. Provide the corrected release and original failing cases to ClassPulse for independent retest.

Several fixes may share a reviewed release. Keep each finding linked to its test, correction, release and retest. Preserve legitimate differences between implementation, merge and deployed commits in R02.

ClassPulse owns the same correction chain for its product. We receive their corrected version and independently retest it.

## 10 Stage seven Handle a genuine no-defect outcome if applicable

First finish the independent coverage review and thorough execution. Record remaining coverage limits and actual outcomes.

The original labsheet describes a TA-assigned isolated exercise. ClassPulse's supplied addendum reports a later instructor clarification permitting a standardized staging exercise with an earlier corrected defect or one existing required-field validation disabled. The addendum states that the announcement's origin was not independently verified. Confirm the applicable clarification with the students/course source before choosing the exercise procedure.

When the standardized process applies, the Product Team prepares the exercise version and keeps the precise defect undisclosed to the independent testers. Identify the exercise release separately from the healthy accepted release. Preserve release controls and agree a usable exercise test environment. The independent team tests and reports its real finding, then the Product Team demonstrates RED, GREEN, regression, review, CI and corrected deployment. The independent team retests.

Record exercise provenance and actual blind discovery in R12. Disclose any prior knowledge affecting independence. If a real exercise/tester dependency prevents completion, record it with the relevant course contact and outcome in R10.

## 11 Stage eight Independently retest and decide acceptance

### Our decision on ClassPulse

1. Confirm the corrected release and its mapping in R02.
2. Reproduce each original failed case using the recorded reproduction and appropriate fresh data.
3. Re-run affected agreed cases. Preserve initial results separately from R06 retests.
4. Resolve all findings and document any minor limitations we explicitly accept.
5. Record our R07 decision as Accepted, Accepted with explicitly documented minor limitations, or Not Accepted, with reasons, exact scope/release, tester identities, actual date and evidence.

### Their decision on Workflow

ClassPulse performs the corresponding retest and provides its own R07 decision for our exact release. Embed that independent record in our final report. If a decision covers a different deployed release, obtain the required affected retest or version clarification.

Acceptance status must match unresolved critical/major defects and required BLOCKED/NOT RUN tests. Keep all limitations visible.

## 12 Stage nine Assemble our one PDF

Use a contents table with Parts A–D, page references and evidence IDs. Include all assessed material directly in the PDF.

| PDF content | Include |
|---|---|
| Identity and scope | Our students/IDs, theme, both teams' identities, both products, repository/URL, delivered Sprint 1 scope and version table. |
| Part A | Full agreed Workflow cases, applicable contract excerpts, setup/account roles, version and retention instructions. |
| Part B | Our independent ClassPulse coverage review, agreed additions/dispositions, full executed case records, actual results, testers/times and selected readable evidence. |
| Part C | Our outgoing ClassPulse reports and all incoming Workflow findings with classifications, reasons, severity, disposition and status. |
| Part D | Our Workflow correction or applicable exercise evidence, meaningful RED/GREEN assertions/output, relevant diff, substantive review, CI/release/deployment and ClassPulse retest/decision. Also include our retest and decision for ClassPulse. |
| Contributions and AI use | Actual work split, cross-review, operator attribution, AI assistance and known limitations. |
| Supporting records | Version register, evidence index, exercise provenance where applicable, unresolved dependencies and internal page references. |

Embed readable Issue/PR discussion and test output excerpts. Include exact commands, versions, assertions and counts. Link external history for corroboration. Keep secrets out of report/screenshots and avoid duplicating unchanged application source or the entire SRS.

## 13 Stage ten Check and submit

- Check every agreed case/subcase is accounted for, including failed, blocked and unrun outcomes.
- Check both students' actual participation and cross-review are recorded.
- Reconcile finding counts, dispositions, fixes and retests.
- Confirm every correction has meaningful RED/GREEN and appropriate regression evidence.
- Check version mappings and both independent decisions identify the actual tested releases.
- Confirm minor-limit acceptance and unresolved dependencies are explicit.
- Inspect the rendered PDF for clipping, broken tables, unreadable screenshots, missing pages and correct internal references.
- Confirm the deadline and LEB2 submission requirements. Upload the approved PDF when authorized, verify the submission receipt and record it in R10.
- Keep the assessed deployments and repositories available through grading under course requirements.

## 14 Working records and files

The ClassPulse R01–R12 identifiers are coordination templates supplied in their pack. We can use them to organize evidence for both directions, with product and team clearly named on each record.

| Record | Purpose |
|---|---|
| R01 | Participants, dates, communication and agreement |
| R02 | Baseline, execution, correction and serving-version register |
| R03 | Actual case/subcase execution |
| R04 | Reproducible outgoing finding |
| R05 | Triage of all incoming findings |
| R06 | Correction and independent retest |
| R07 | Independent decision per product |
| R08 | Evidence index |
| R09 | Contributions, review and AI use |
| R10 | Dependencies, TA/course contact and submission receipt |
| R11 | Independent coverage assessment and additions |
| R12 | Controlled exercise provenance and blind discovery |

Existing files

- D:/Downloads/lab06-uat-cases-en037-aligned.docx
- D:/Downloads/ClassPulse_Lab6_CD_Handoff_v2_1.zip
- C:/Users/KEN/Documents/ChatGPT/Software Engineer/R11-ClassPulse-coverage-review-draft.md
- D:/Downloads/Software Engineer KMUTT/LAB-6-SOURCES.md

## 15 Immediate next work after corrected deployment

1. Send the prepared acknowledgement of ClassPulse A's accepted independent retest through the student channel. Preparation does not establish delivery.
2. Preserve the accepted ClassPulse independent WF-BUG-001 retest and original failure separately. Record the closed finding disposition without treating it as whole-product acceptance.
3. Account for remaining agreed Workflow additions, including the incomplete APPROVE-501 capture and unexecuted API branches, before the partner's final acceptance.
4. Wait for actual ClassPulse CD-07 third-respondent and CD-01 inactive-account setup evidence/private access, then execute the remaining agreed branches. Retain controlled-session and other coverage limits explicitly.
5. Complete final coverage and finding dispositions for ClassPulse. If no genuine finding exists after thorough agreed coverage, follow the instructor's controlled educational-exercise process rather than inventing a natural defect.
6. Record actual contributions, remaining partner acknowledgements and exact appointment/channel agreements, then prepare both products' independent acceptance decisions.
7. Assemble and visually inspect the self-contained PDF, confirm the applicable course deadline, and submit only the completed reviewed deliverable. Record the actual submission receipt.

Further Lab 6 fixes and documentation changes use lab6 integration. The current working records establish completed observations and deployment, while independent corrected-live retest, acceptance and submission remain pending.

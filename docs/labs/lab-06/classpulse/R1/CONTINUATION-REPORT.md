> Execution continuation retained with its original checkpoint. Later update: agreed guarded and original CD-08 missing-ID calls both returned 404; see CD08-missing-ID-result.json. Workflow correction is now deployed; its independent corrected-live retest remains pending. Current status is in ../../STATUS.md.

# ClassPulse R1 continuation after remaining account access

See LAB-6-AI-USE-AND-CONTRIBUTIONS.md for the required AI-use and contribution declaration.
Prepared 24 November 2026. Peer sign-off and final acceptance remain pending.

This continuation supersedes the account-blocked status in REPORT.md. Read both with continuation-results.json, which contains the accumulated execution records from both portions of R1. CP-V01 remains the partner-reported version basis. Cloud metadata was not independently re-read during this continuation.

## Access

On 24 November 2026 at 17:57:05 Asia/Bangkok, one attempt per account with the supplied shared synthetic password succeeded for Owner B, Respondent 2 and Respondent 3. Login and identity endpoints returned 200 with the correct roles. Each verification session was logged out, then independent browser sessions were opened for the case execution. Passwords and cookie values are excluded from saved evidence.

## Original cases completed in this continuation

| Case | Actual outcome | Result |
|---|---|---|
| UAT-03 remaining other-owner checks | Owner B's detail, summary and close attempts returned 404. Owner A readback remained Published with one response. Respondent 403 checks were recorded in the earlier segment. | PASS observed behavior |
| UAT-06 | Respondent 3 list excluded S1, detail returned 404, valid response attempt returned 403 NOT_ELIGIBLE; S1 retained count 1. | PASS observed behavior |
| UAT-09 remaining privacy check | Respondent 2 received 404 for response 3. Original response was reloaded in the respondent UI with 4/Online and its original timestamp. Earlier owner403 and own PUT/DELETE404 readbacks remain valid. | PASS observed behavior |
| UAT-12 remaining ownership checks | Owner A's courses excluded CPE231; Owner B's list excluded S1. Creation on course 2 with valid and blank titles both returned 404, and Owner B's list remained empty. Owner B publish returned 404; S1 retained state/count. Other role/auth checks were recorded earlier. | PASS observed behavior |
| UAT-05 | After pre-close dependencies completed, Owner A closed S1 through UI. Respondent 2 could no longer list/read it; detail404 and response POST409 SURVEY_NOT_OPEN. Original response3 remained readable, summary Closed/count1/4.00. | PASS observed behavior |
| UAT-10 | Closed publish/close and Draft close returned 409 INVALID_TRANSITION with unchanged state. Draft survey22 was hidden from Respondent 2, GET404, responsePOST409. Publishing survey22 succeeded; repeated publish409 left Published/count0. S1 retained Closed/count1. | PASS behavior, API-created fixture |
| UAT-02 | Empty title rejected through UI with valid rating/choice questions and no added survey ID. UI missing answers showed both required fields. API empty answers plus ratings0,6,2.5,string3 each returned400 with count0 readbacks. Respondent2 UI rating1 saved response9 and average1.00; Respondent1 UI rating5 saved response10, count2/average3.00, buckets1=1 and5=1, Online2/In person0. | PASS observed behavior |
| UAT-11 | API-created survey24, optional Extra rating. Respondent1 submitted4/Online through UI, omitting Extra; response11 JSON contained no Extra answer. Respondent2 UI submitted5/Online/Extra1, response12. Owner UI/API showed count2, Overall4.50, Extra1.00, correct buckets/choices and no identities. API reload returned identical summary. | PASS behavior, API-created fixture |

Combined with the earlier UAT-01,04,07,08 observations, all twelve original case behaviors have passing observations. UAT-08,10,11 used API fixture creation in place of common UI setup. This deviation is retained for report review. Final acceptance remains pending.

## Additional coverage progressed

CD-08's non-enrolled Draft branch used Respondent3 on new survey25 and returned403 NOT_ELIGIBLE. Its enrolled Closed/empty-answers branch used Respondent2 on survey20 and returned409 SURVEY_NOT_OPEN. Owner readbacks retained Draft/Closed statuses and count0. Its verified-nonexistent-ID branch remains pending an agreed verification method.

Previously executed CD-01 core, CD-02,03,04,05,06 observations remain in the accumulated log. CD-01 inactive-account and controlled session coverage remain pending. CD-07 requires a third enrolled synthetic respondent supplied through an agreed additive fixture. Existing Respondent3 enrollment was preserved.

No ClassPulse application defect was established in the completed observations. The incomplete additional branches and pending fixture dispositions prevent a comprehensive no-defect conclusion and final R07 acceptance.

## Tool-input correction

During UAT-02, an empty-string DevTools fill did not clear the already populated title. Clicking Create then legitimately saved the valid titled survey23. That attempt was logged as a tool-input issue. The empty-title check was repeated using an untouched blank title on a fresh form with both valid required questions. It showed the title error and the before/after owned survey-ID list stayed identical. No blank-title acceptance bug is claimed.

## Retained data and evidence

- S1 survey6 is now Closed with response3 and count1.
- S10 survey22 is Published with count0 after legal/illegal-transition probes.
- S2 survey23 is Published with responses9/10 and count2.
- S11 survey24 is Published with responses11/12 and count2.
- CD08 survey25 remains Draft/count0.
- Original pre-existing records and all prior R1 synthetic records remain retained.
- continuation-results.json is the latest accumulated log.
- additional-account-access.json records sanitized access outcomes.
- 11-two-respondent-summary.png captures the real 4.50/1.00 owner summary.
- 02-empty-title-rejected.png captures the correct final empty-title validation.

API timestamps in the JSON are UTC. Add seven hours for Asia/Bangkok. Continuation ran approximately 17:57–18:03 on 24 November 2026.

## Remaining work

1. Resolve third-enrolled-respondent, inactive-account and verified missing-ID coverage with the Product Team.
2. Record partner B's actual review and final mutually agreed inventory state when received.
3. Complete any remaining agreed special-fixture tests and record the actual acceptance/exercise outcome.
4. Include the required contribution and AI-use declaration in the PDF.
5. Our Workflow finding WF-BUG-001 remains a separate product-team discovery with correction and independent confirmation/retest pending.

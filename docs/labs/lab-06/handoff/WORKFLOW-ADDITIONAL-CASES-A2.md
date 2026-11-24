# Workflow additional cases: agreed A2 scope

Tester-readable execution guide for PARTNER-ADD-01–06. The Product Team technically accepted revision A2, including Unicode purpose/reason bounds, exploratory padded-reason storage and separately controlled restart/new-instance scope. This guide contains expectations, not prefilled execution results. Actual case allocation, results and any outstanding setup agreements remain separate records. See [remaining work](REMAINING-TESTS.md).

Read [TESTER-START-HERE.md](TESTER-START-HERE.md) first and identify the actual release with every result. Requirements are in the [pinned Sprint 1 contract](https://github.com/osizk/WorkflowAndApprovalSystem/blob/ad2cbef67decf9953219694898327dea0bb66034/docs/sprints/sprint-1/contracts.md). Normal API requests use the current authorized browser session and origin, JSON bodies for POST/PUT, and actual UUIDs. Do not export credentials, cookies or raw authorization headers.

Default valid create body: {"title":"UAT-<case>-<initials>-<HHmmss> description","purpose":"Purchase stationery for the team","amount":"125.50"}. POST /api/requests should return 201 with request detail, an actual ID, the server-assigned reviewer, SUBMITTED and one initial SUBMITTED event. GET /api/requests returns the authorized list; GET /api/requests/<id> returns detail. Decision endpoint: POST /api/requests/<id>/decision.

Keep other fields valid when testing one boundary. Retain all created records. After unexpected success in a negative test, stop that affected chain, preserve the actual state and report it; use a separately agreed fresh fixture for remaining tests. A successful UI input check is not an unmeasured API status result.

## PARTNER-ADD-01: authentication/session

Refs AC-01/02/03, FR-01. Reported lead A. Start signed out with synthetic private access.

1. POST /api/session once with an existing synthetic login and a wrong throwaway password, then once with an agreed unknown synthetic login. Expect 401 INVALID_CREDENTIALS with the same generic message. After each, GET /api/session expects 401 AUTH_REQUIRED. No successful session should result.
2. Sign in normally as requester1; GET /api/session expects 200 with only id and role, role REQUESTER, no hash/token in JSON. Reload and compare identity. In a separate normal sign-in verify reviewer1 has REVIEWER role.
3. DELETE /api/session expects 204. GET session and protected list/detail afterward expect 401 AUTH_REQUIRED without request data. Repeated logout also expects 204. Record each actual call and signed-out readback.
4. Inspect cookie attributes with values hidden: HttpOnly, SameSite=Lax, Path=/ and Secure over HTTPS, with lifetime matching eight hours. If the tool cannot expose attributes, record that limitation rather than PASS.
5. Exact eight-hour expiry and server rejection of a previously saved old cookie require a separately agreed secret-safe controlled method. Current-browser 401 after logout alone does not establish replay rejection. Do not alter clocks/session tables or save raw cookie values. Keep these branches pending until setup is arranged or a reasoned residual-limit disposition is agreed.

## PARTNER-ADD-02: title, purpose and payload boundaries

Refs AC-05, BR-09/01. Reported lead B. requester1 has its normal reviewer mapping. Use fresh tracking per successful create and amount as string "125.50".

For each row, POST a separately identified attempt. Expected accepted response: 201, exact normalized saved text/amount, SUBMITTED and one initial event. Expected invalid response: 422 VALIDATION_ERROR with the relevant field error and no saved request for that attempt. Compare authorized lists and accepted detail externally; do not claim a database inspection.

| A2 subcase | Inputs to test separately | Expected |
|---|---|---|
| 02a | ASCII title lengths 2, 3, 120, 121 | 2/121 rejected; 3/120 accepted |
| 02b | ASCII purpose lengths 9, 10, 2000, 2001 | 9/2001 rejected; 10/2000 accepted |
| 02c | title "  ABC  "; separately all-space title and all-space purpose | Stored title ABC accepted; each blank-only field rejected |
| 02d | title 'T'.repeat(119)+'😀'; then 'T'.repeat(120)+'😀' | 120 Unicode code points accepted; 121 rejected |
| 02e | Otherwise valid body plus requesterId equal to a different authorized fixture's actual ID | Unexpected key rejected with 422; no new request |
| 02f | Otherwise valid body plus status "APPROVED" | Unexpected key rejected with 422; no new request/history |
| 02g | purpose 'P'.repeat(8)+'😀', 'P'.repeat(9)+'😀', 'P'.repeat(1999)+'😀', 'P'.repeat(2000)+'😀' | Code-point lengths 9/10/2000/2001: 9/2001 rejected; 10/2000 accepted |

Count with Array.from(value).length, not UTF-16 string .length. Exact title-boundary tests may omit the normal prefix and put the run marker in a valid purpose and evidence record. Purpose-boundary tests keep the marker in a valid title. Never add a marker to the field being measured. Use API calls where browser constraints prevent sending the exact input. The earlier UI observations remain supplemental; they do not fill API-only 02e/02f or unmeasured 422 outcomes.

## PARTNER-ADD-03: rejection/approval reason limits

Refs AC-11, BR-05. Reported lead B. Create a fresh requester1 record assigned to reviewer1; retain ID, 125.50, SUBMITTED and one initial event. As reviewer1:

1. REJECT with reason of three spaces: expect 422 and unchanged state/history.
2. REJECT with 'R'.repeat(501): expect 422 and unchanged state/history.
3. APPROVE with 'R'.repeat(501): expect 422 and unchanged state/history. Capture the completed response, not only Saving decision, and reload/read back the unchanged request.
4. Use a separate fresh record to REJECT with 'R'.repeat(500): expect 200 REJECTED, exact saved reason and one REJECTED event after SUBMITTED. Requester1 independently retrieves the same record.
5. On another fresh record, REJECT with 'R'.repeat(500)+'😀' (501 code points): expect 422 and unchanged state/history. Then REJECT with 'R'.repeat(499)+'😀' (500 code points): expect 200 REJECTED, the supplied reason and one terminal event; verify requester readback.

Each body uses decision APPROVE or REJECT and the specified reason. Keep run markers outside the measured reason. Do not submit a valid boundary to a terminal record and confuse 409 with a validation result. Empty reason/ordinary rejection remains original UAT-05; omitted approval reason remains UAT-01. Padded-reason storage is exploratory unless its exact storage expectation is separately agreed: length/nonblank validation after trimming is required, but the contract does not clearly mandate trimming the stored reason itself.

## PARTNER-ADD-04: repeated/competing decisions

Refs AC-12, BR-06/07. Reported lead B. Perform UAT-04 comparison on the UAT-01 record before terminal-repeat probes.

1. As reviewer1, repeat APPROVE on the retained APPROVED UAT-01 ID, then try REJECT with a valid reason. Each expects 409 DECISION_CONFLICT. After each, authorized detail must retain APPROVED, original amount/reason and exactly the original two events. A separately agreed REJECTED-terminal branch uses its own retained rejection record.
2. On a dedicated fresh SUBMITTED record assigned to reviewer1, dispatch exactly one APPROVE and one REJECT with reason Synthetic concurrent decision check using Promise.all or the agreed equivalent. Agree session/data isolation before dispatch.
3. Expect exactly one 200 and one 409 DECISION_CONFLICT. Retry the losing decision once; expect 409. Retrieve as requester1 and reviewer1: terminal state matches the winner; exactly one matching terminal event follows SUBMITTED; amount and winning reason/null persist.

Use new data for a fresh competing-call run. A network/dispatch block is not PASS. Two competing external calls do not prove exact transaction overlap or forced rollback. No request loop/load test is requested.

## PARTNER-ADD-05: backend role/assignment/immutability

Refs AC-07/08/09, BR-01/02/04. Reported lead B. Use fresh requester1-owned SUBMITTED data assigned to reviewer1; retain exact title/purpose/125.50/history baseline.

1. As reviewer2, POST APPROVE to that ID: expect 404 NOT_FOUND without request/history disclosure. Authorized requester readback must remain unchanged.
2. As requester2, GET that ID: expect 404 NOT_FOUND and exclusion from its list. Authorized owner readback remains unchanged. Record the API result separately from original UAT-03's UI evidence.
3. As reviewer1, POST /api/requests with an otherwise valid create body: expect 403 FORBIDDEN. Record authorized external list/detail comparisons for no successful create or decision write; do not claim all database rows were inspected. Original UAT-06 separately tests requester-decision 403.
4. As requester1, PUT /api/requests/<owned-submitted-id> with {"title":"Synthetic attempted edit"}. Expect no successful edit and unchanged saved title/purpose/amount/status/history on authorized readback. The Product Team accepted testing this path for rejection. Record the actual status/content type; no contract-specific 404/405 promise is invented.

Unexpected ownership/status keys are ADD-02, not an automatically completed ADD-05 result. Sign out between roles and verify identity before each chain.

## PARTNER-ADD-06: keyboard/mobile/durable retrieval

Refs AC-14, NFR-01/04. Reported lead A. Record actual browser and viewport; agreed target sizes are desktop 1366x768 and mobile 390x844.

1. Keyboard journey: sign in, create, submit, review, decide and retrieve with keyboard controls. Record actual focus path, visible focus, labels and a triggered readable required-field error. Report specific failures; do not claim a generic accessibility certification.
2. At 390x844 inspect login, create form, detail and decision views. Content/actions must be reachable without page-level horizontal overflow, with labels/status/errors available as text. Preserve screen/viewport evidence.
3. 06c-R: separately agree a Product-Team-operated actual application process/instance restart on the same source/image and database after creating/deciding the comparison record. Record operator/resource, stop/start time and version. Independently retrieve the same ID under both roles and compare amount/status/history/reason.
4. 06c-N: a separately agreed alternative scope is new-instance retrieval on the same source/image/database. Show that the new instance actually handled the readback using agreed sanitized correlated evidence. Do not call it restart of the old process. Existence of another instance or a load-balanced request alone is insufficient. Without evidence, keep the assertion unproven/BLOCKED.

Neither durability scope is replaced by fresh browser-session retrieval. Testers do not restart or scale the service under this handoff. Product-Team setup/build/test evidence remains separately attributed.

## Controlled requirements and closure

Absent/wrong-role reviewer mapping (AC-06), self-assignment refusal, forced event-insertion rollback (AC-13), and exact expiry/replay require agreed isolated setup or a reasoned explicit coverage-limit disposition. Do not mutate live assignments/database/clock to obtain these fixtures. Do not silently remove agreed requirements or label developer tests independent UAT.

Record every subcase in the [execution template](EXECUTION-RESULTS-TEMPLATE.csv), adding rows where needed. Return actual results and setup/coverage limits before the [independent acceptance form](FINDING-AND-ACCEPTANCE-TEMPLATES.md) is completed.

# Feature inventory — v0.3

| Feature | Sprint | Depends on | Description | Requirements |
| --- | --- | --- | --- | --- |
| F-01 Identity and session | 1 | Seed users | Authenticate seeded users and revoke their sessions. | [FR-01](srs.md#functional-requirements), [BR-01](srs.md#business-rules), [NFR-02](srs.md#important-nonfunctional-requirements), [NFR-03](srs.md#important-nonfunctional-requirements), [NFR-04](srs.md#important-nonfunctional-requirements) |
| F-02 Submit and retrieve | 1 | F-01, schema, reviewer mapping | Submit an internal purchase request and read its saved status. | [FR-02](srs.md#functional-requirements), [FR-03](srs.md#functional-requirements), [BR-01](srs.md#business-rules), [BR-03](srs.md#business-rules), [BR-04](srs.md#business-rules), [BR-09](srs.md#business-rules), [NFR-01](srs.md#important-nonfunctional-requirements), [NFR-02](srs.md#important-nonfunctional-requirements), [NFR-04](srs.md#important-nonfunctional-requirements) |
| F-03 Review and history | 1 | F-01, F-02, transaction support | Review assigned requests and persist one decision with history. | [FR-04](srs.md#functional-requirements), [FR-05](srs.md#functional-requirements), [FR-06](srs.md#functional-requirements), [BR-02](srs.md#business-rules), [BR-05](srs.md#business-rules), [BR-06](srs.md#business-rules), [BR-07](srs.md#business-rules), [BR-08](srs.md#business-rules), [NFR-01](srs.md#important-nonfunctional-requirements), [NFR-02](srs.md#important-nonfunctional-requirements), [NFR-04](srs.md#important-nonfunctional-requirements), [NFR-05](srs.md#important-nonfunctional-requirements) |
| F-04 Return/revise/resubmit | 2 | F-02, F-03 | Return a request for revision and let its owner resubmit it. | [FR-07](srs.md#functional-requirements) |
| F-05 Filter work lists | 2 | F-02, F-03 | Filter a scoped request or review list. | [FR-09](srs.md#functional-requirements) |
| F-06 Decision summaries | 3 | F-03 | Summarize visible decisions without exposing unrelated requests. | [FR-10](srs.md#functional-requirements) |

FR-08 (additional approval stages) is an unscheduled candidate.
See [traceability](traceability.md) for coverage and verification.

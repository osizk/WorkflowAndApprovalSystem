# Requirements traceability — v0.3

| Feature | Sprint | SRS coverage | Depends on | Verification / gap |
| --- | --- | --- | --- | --- |
| F-01 Identity and session | 1 | FR-01; BR-01; NFR-02–04 | Seed users | AC-01–03 / TEST-01–03 |
| F-02 Submit and retrieve | 1 | FR-02–03; BR-01, BR-03–04, BR-09; NFR-01–02, NFR-04 | F-01, schema, reviewer mapping | AC-04–08 / TEST-04–08 |
| F-03 Review and history | 1 | FR-04–06; BR-02, BR-05–08; NFR-01–02, NFR-04–05 | F-01, F-02, transaction support | AC-09–13 / TEST-09–13 |
| F-04 Return/revise/resubmit | 2 | FR-07 | F-02, F-03 | Later contract |
| F-05 Filter work lists | 2 | FR-09 | F-02, F-03 | Later contract |
| F-06 Decision summaries | 3 | FR-10 | F-03 | Later contract |
| Release checks | 1 | NFR-06; cross-feature NFR-01, NFR-03–04 | F-01–03 | AC-14 / TEST-14 |
| Additional approval stages | Unscheduled | FR-08 candidate | Scope approval | Outside baseline |

No SRS requirement IDs were added or changed. All verification rows are planned; actual test paths, results and tested release commit will be recorded after execution.

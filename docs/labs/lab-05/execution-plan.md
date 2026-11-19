# Lab 5 execution plan

Updated for the course shared-cloud announcement and team Starter Kit
`scd928edd`. The announced Lab 5/Lab 6 deadline is 22 November 2026.
Kane takes over implementation, deployment preparation, testing and the PDF.
Pex remains the peer reviewer for Kane-authored PRs. Record each student's
actual contribution. Do not claim a live deployment from an offline preview.

1. **Reuse completed work.** #34/PR #35 provide Docker and clean-clone evidence;
   #36/PR #37 provide PR CI. #39 is closed with the blocked-merge demonstration
   in closed, unmerged PR #43. Retain those records rather than repeating them.
2. **Release the Docker/CI baseline.** Pex reviews PR #47 from `lab5-staging`
   to `main` and merges only after required checks and approval. Kane does not
   merge their own PR. Preparation of #46 can continue while #47 awaits review.
3. **Continue #41/PR #46.** Keep `feature/lab5-41-cloud-release` and target
   `lab5-staging`. Adapt the course Kit for the existing app, preserving its
   Dockerfile and CI workflow. Verify scripts, image, app tests and dry runs
   before requesting review. Include the revised deployment guide in this PR.
4. **Check #44 against real portal status.** Replace the previous personal
   Free Trial/manual infrastructure plan with the shared course project
   `cpe-se-course-2026`. Inspect the group's resources and GitHub configuration;
   do not infer missing setup from the repository-check screenshot. Complete
   only missing steps. If an operation needs the registered portal account,
   Pex handles that access step. Do not create SQL/IAM/resources or share login
   credentials. A portal check does not block local code preparation.
5. **First live deployment, #40.** After reviewed release into `main` and
   verified resource/configuration readiness, run the main workflow. Initial
   account seeding uses existing private secret slots. Migrate before service
   update. Verify the public app and database, and retain commit/digest/revision
   evidence before marking #40 Done.
6. **Automatic release, #41.** Deliver a visible change through a reviewed
   staging PR and reviewed release PR. Compare its Actions run, image and
   serving revision. Keep #41 open until the real C-06 evidence exists, even
   if PR #46 has merged to staging.
7. **Live workflow and PDF, #42.** Verify requester submission, assigned-reviewer
   decision and a forbidden action on the public URL. Compare the same ID,
   status and history after restart and redeploy. Assemble Answer Parts 0–4,
   direct evidence links and readable screenshots, and record actual member
   contributions. Do not mark it complete while live evidence is pending.

Move board cards immediately with `gh project item-edit` as work changes:
Started, PR Review, Fixing after requested changes, and Done only with evidence.
Link the PR in the Issue's Development section before PR Review. Keep existing
Issues and branches; create a new branch only for a distinct required change.
Use a new staging-to-main release PR after #46, not a duplicate workflow PR.

The parent #38 was closed for the planning change; that does not mean #40,
#41 and #42 are complete. The live Issues and evidence determine completion.

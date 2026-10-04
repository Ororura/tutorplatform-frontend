# M16 critical release gate

## Coverage audit

The audit was performed against frontend main `a0af720`. Existing journeys are
retained where they already exercise real browser/API behavior. Every spec sets
up its own mutable data or reads deterministic demo identities; no file consumes
another file's newly created data.

| Capability                                                  | Existing test                                                       | Critical? | Missing at audit                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| Teacher login, session reload, logout                       | accept-student-invite; teacher-students-demo                        | Yes       | Explicit authenticated login/reload assertion          |
| Student invite/registration                                 | accept-student-invite                                               | Yes       | No                                                     |
| Student management                                          | teacher-students-demo                                               | Yes       | No                                                     |
| Program/module/topic authoring                              | teacher-program-editor-demo                                         | Yes       | No                                                     |
| Materials                                                   | teacher-material-editor-demo                                        | Yes       | No                                                     |
| Task library, homework assignment                           | teacher-tasks-homework-demo                                         | Yes       | Submission/review lifecycle                            |
| Program assignment                                          | teacher-program-assignment-demo; program-duplication-evolution-demo | Yes       | Include assignment spec; remove seed count assumptions |
| Session, assessment                                         | teacher-lesson-sessions-demo; current-progress-journey-demo         | Yes       | Include sessions spec                                  |
| Student dashboard/program/materials/practice                | student-learning-journey-demo                                       | Yes       | Persisted execution assertion                          |
| Student homework, TEXT submit/review/result/completion      | teacher-tasks-homework-demo                                         | Yes       | Add homework-submissions journey                       |
| CODE editor/run/failure/submit/persistence                  | student-learning-journey-demo; browser-security                     | Yes       | Add execution journey with real worker evidence        |
| LOCKED/direct URL/AVAILABLE/IN_PROGRESS                     | Unit tests only                                                     | Yes       | Add isolated topic-access journey                      |
| Learning fact changes progress API/UI                       | teacher-lesson-sessions-demo; current-progress-journey-demo         | Yes       | Assert before/after delta                              |
| Current progress share/public projection/revoke             | current-progress-journey-demo                                       | Yes       | No                                                     |
| Learning period/draft/publish/share/public/PDF/revoke       | progress-report-journey-demo                                        | Yes       | No                                                     |
| Content Package v2 preview/import/TEXT/CODE/config/counts   | teacher-content-package-import-demo (v1)                            | Yes       | Add v2 journey; include existing import specs          |
| Hidden tests remain private                                 | browser-security; unit tests                                        | Yes       | v2 preview and student run projections                 |
| Duplication/source unchanged/assignment on source           | program-duplication-evolution-demo                                  | Yes       | No                                                     |
| Mobile login/dashboard/program/homework/detail/topic/public | Layout specs, some mocked                                           | Yes       | Focused real-stack mobile smoke                        |
| CSP/nonces/cookies/browser enforcement                      | browser-security                                                    | Yes       | No                                                     |

## Environment and independence

Use `.github/e2e/compose.yml`: tmpfs PostgreSQL, demo-seeded real backend,
production-built frontend and execution worker using Docker sandboxes. CI checks
out backend and worker `main` into `.e2e-dependencies`. Local runs use those same
checkouts with `E2E_BACKEND_CONTEXT` and `E2E_WORKER_CONTEXT` overrides.

Only loopback base URLs are accepted by Playwright. Public production/demo hosts
and arbitrary remote hosts are rejected before collection. New mutations use
unique names; browser UI creates content and assignments. API requests are used
for readback assertions, not SQL or database setup. Run with one worker because
existing demo journeys deliberately share seeded identities. The release gate
has no retries, mocks, external LLM calls, or fixed-delay synchronization.

## Artifacts

Public share and invitation journeys disable traces/screenshots because their
URLs are bearer credentials. CI retains failure reports, safe traces/screenshots
and sanitized container logs for 14 days. Artifact sanitation removes session
cookies, passwords and bearer URLs before upload. Videos are disabled.

## Validation

Final validation and three consecutive critical run results are recorded in the
pull request. Each run must pass without retries; repeat runs exercise existing
state as well as new unique fixtures.

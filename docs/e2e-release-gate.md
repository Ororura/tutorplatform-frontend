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
has no retries, mocked backend/execution results, external LLM calls, or
fixed-delay synchronization. The CSP enforcement test serves only its own probe
script through a browser route, not a mocked product API.

## Release journeys

`npm run e2e:critical` selects 25 tests in 19 specs through
`playwright.critical.config.ts`. `npm run e2e` still collects the broader suite.

| Journey                                                  | Spec (under `e2e/`)                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Authentication/session/logout/invite                     | `auth-session.spec.ts`, `accept-student-invite.spec.ts`                                 |
| Student management                                       | `teacher-students-demo.spec.ts`                                                         |
| Program/module/topic/material authoring                  | `teacher-program-editor-demo.spec.ts`, `teacher-material-editor-demo.spec.ts`           |
| Assignment and independent evolution                     | `teacher-program-assignment-demo.spec.ts`, `program-duplication-evolution-demo.spec.ts` |
| Sessions/assessment/progress deltas                      | `teacher-lesson-sessions-demo.spec.ts`, `current-progress-journey-demo.spec.ts`         |
| Student dashboard/program/materials/practice/homework    | `student-learning-journey-demo.spec.ts`                                                 |
| LOCKED/direct URL/AVAILABLE/IN_PROGRESS                  | `topic-access-journey.spec.ts`                                                          |
| TEXT submission/rejection/resubmission/review/completion | `teacher-tasks-homework-demo.spec.ts`                                                   |
| CODE Run/failure/Run success/Submit/persisted result     | `execution-journey.spec.ts`                                                             |
| Report-ready/draft/publish/public projection/revoke/PDF  | `progress-report-journey-demo.spec.ts`                                                  |
| Content v1 compatibility and v2 TEXT/CODE import         | `teacher-content-package-import-demo.spec.ts`, `content-package-v2-journey.spec.ts`     |
| Focused iPhone-sized student/public smoke                | `mobile-release-smoke.spec.ts`, `mobile-public-smoke.spec.ts`                           |
| CSP/nonces/cookies/browser enforcement                   | `browser-security.spec.ts`                                                              |

Run and submission are distinct: transient Run does not increment submission
history. Its backend-issued execution ID must appear in worker
`DockerSandboxRuntime` logs; wrong-output and passing runs both use the sandbox.
Submission details and history are then read back after a browser reload.

TEXT review checks both FAILED and PASSED after NEEDS_REVIEW, a new attempt after
rejection, persisted student-visible status and completion when the required
TEXT item passes even though optional CODE remains incomplete. Topic access uses
a newly imported and assigned program, so it never consumes seed topic state.
Session history, the task bank and teacher homework lists locate the correct API
page before opening the real UI page. The homework task picker uses its actual
pagination controls. Seed records and newly created records remain testable on a
repeatedly used stack without resetting the database to hide collection growth.

For local port conflicts, set `E2E_FRONTEND_PORT`, `E2E_BACKEND_PORT` and
`E2E_WORKER_PORT`; all bindings remain loopback-only. Set `PLAYWRIGHT_BASE_URL`
to that frontend port. `sandbox-image` pulls the pinned Python image before
worker startup. Workspace volume names follow the Compose project name.

CI uses the existing chain: frontend and delivery checks -> critical E2E ->
production image build/security scan -> deploy. No second E2E pipeline is added.

## Artifacts

Public share and invitation journeys disable traces/screenshots because their
URLs are bearer credentials. CI retains failure reports, safe traces/screenshots
and sanitized container logs for 14 days. Artifact sanitation removes session
cookies, passwords and bearer URLs before upload. Videos are disabled.

Only `e2e-artifacts/` is uploaded. The sanitizer handles nested trace ZIPs and the
HTML report's embedded ZIP, preserves the immutable report/trace viewer code,
and keeps cookie arrays empty so trace resources remain structurally usable.
Operational regression tests cover credential removal and viewer preservation.
The sanitized failure HTML report was opened in Chromium without JS errors.

## Validation

Validated on 2026-10-04 with backend main `672b598` and execution worker main
`8e39f90`, against frontend main `a0af720` plus this branch's test/infrastructure
changes. The isolated stack was not reset between final runs.

| Consecutive run | Passed | Failed / flaky / skipped | Duration |
| --------------- | ------ | ------------------------ | -------- |
| 1               | 25     | 0 / 0 / 0                | 60.03 s  |
| 2               | 25     | 0 / 0 / 0                | 61.82 s  |
| 3               | 25     | 0 / 0 / 0                | 59.07 s  |

All runs used `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3300 npm run e2e:critical`,
one worker and zero retries. Earlier repeat-run failures exposed seed records
moving off page 1; those assertions now account for pagination instead of
clearing data, adding delays or retrying failures.

| Check                                              | Result                           |
| -------------------------------------------------- | -------------------------------- |
| `npm run format:check`                             | PASS                             |
| `npm run typecheck`                                | PASS                             |
| `npm run lint`                                     | PASS                             |
| `npm run test`                                     | 134 files / 623 tests PASS       |
| `npm run build`                                    | PASS                             |
| `python3 -m unittest discover -s tests/ops -v`     | 38 tests PASS                    |
| `rhysd/actionlint:1.7.12 .github/workflows/ci.yml` | PASS                             |
| Isolated Docker Compose startup/readiness          | PASS                             |
| `git diff main --check`                            | PASS                             |
| Sanitized failure HTML report in Chromium          | Opened with no JavaScript errors |

The macOS sandbox cannot bind the operational smoke server or launch Chromium;
those checks were run with the required local execution permissions. No
production deployment was performed. The broader `npm run e2e` is not the
release gate and was not run in full.

## Deliberate boundaries

Mobile smoke uses Chromium with a 390 x 844 touch viewport, not a complete second
desktop run or a WebKit/physical-device matrix. Admin teacher onboarding and
mocked layout/empty/error-state permutations stay in the broader `npm run e2e`
suite. Prompt generation is covered by existing unit tests; no external LLM is
required. Production and public demo environments are never mutation targets.

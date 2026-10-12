# M18 teacher daily workflow

The teacher dashboard now offers a paginated work queue with category filters,
oldest-first ordering within each category, resource titles and direct review
links. Submission review reuses the existing text-review mutation and homework
review component. A confirmed server result updates the queue and progress;
failed requests never show a successful decision. A processed submission offers
the next waiting work and cannot be reviewed again in the UI.

The student overview adds four compact indicators and existing contextual
routes for creating sessions, assigning homework, opening progress and reports.
Indicators distinguish loading, unavailable and genuinely empty data. Creation
requires an active owned student and an assigned program. Existing forms remain
the implementation of all write actions.

## API reuse and extensions

- Existing dashboard counts and attention types are retained. Dashboard attention
  remains capped at 20 for compatibility; the queue uses the paginated subresource.
- New `GET /api/v1/teacher/dashboard/attention` accepts `type`, `studentId`, `page`
  and `size` (1–100). SQL filters before pagination and orders submissions,
  overdue homework, then report-ready periods; oldest events and stable IDs come
  first. Titles are joined in the same projection, without per-row requests.
- New `GET /api/v1/teacher/students/{studentId}/submissions/{submissionId}` reuses
  the ownership and submission-context checks of review.
- Existing sessions list accepts optional `attendanceStatus` and `startedBefore`.
  Student Context requests the latest past `ATTENDED` session. Its stable query
  key recomputes the cutoff on every fetch.
- Existing homework, submissions, programs, progress, learning periods and report
  APIs are reused. The `PATCH .../submissions/{submissionId}/review` business
  workflow and its domain events are unchanged.
- Generated frontend types were regenerated from local OpenAPI. No migrations,
  worker, authentication/session or deployment changes were required.

## Synchronization

| Action                         | Refreshed read models                                           |
| ------------------------------ | --------------------------------------------------------------- |
| Review                         | Submission, homework, queue/dashboard, student progress/program |
| Create/update/cancel homework  | Homework, queue/dashboard, student progress/program             |
| Create/update session          | Sessions, queue/dashboard, progress, learning periods/program   |
| Generate/update/publish report | Reports/periods, queue/dashboard                                |

Student Context observes these existing query keys. Invalidation is scoped to
named read models and the affected student where the API supplies that context.
Confirmed review results also update the cached homework submission list so an
unsuccessful list refetch cannot re-offer a processed answer. An emptied final
queue page retains a link back to the first page.

## Validation

- Frontend: 651 Vitest/React Testing Library tests in 142 files passed;
  TypeScript, ESLint, Tailwind lint, Prettier and production build passed.
- Backend: 1,021 JUnit tests in 92 suites passed without failures, errors or skips;
  `spotlessCheck` passed. Coverage includes primary ownership, foreign/mismatched
  submission access, filter validation, empty pages, ordering and OpenAPI.
- Production frontend + real local backend/PostgreSQL: M18, text-review/homework,
  lesson sessions and progress-report E2E all passed. PostgreSQL uses the existing
  `.github/e2e/compose.yml` in an isolated project with loopback ports. No product
  API mocking or public production/demo writes are used.
- Screenshots and overflow/hit-target checks cover 375, 768, 1280 and 1440 px.
  Keyboard tab order, visible focus and browser page errors are checked by M18 E2E.
  Evidence is in [ui-qa/m18](ui-qa/m18).

Run the focused journeys against an isolated local stack:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:13000 npm run e2e:critical -- \
  e2e/teacher-daily-workflow.spec.ts \
  e2e/teacher-tasks-homework-demo.spec.ts \
  e2e/teacher-lesson-sessions-demo.spec.ts \
  e2e/progress-report-journey-demo.spec.ts
```

The M18 spec creates its own program, homework, submission and completed period
through existing UI, using unique names. Imported tasks follow DRAFT → ACTIVE
through the existing task editor. Queue and task-picker navigation handles
pagination without fixed delays.

## Manual check

1. Log in as a teacher and open the dashboard. Switch all four queue filters.
2. Open waiting work directly from the queue; inspect answer, attempt and task.
3. Accept or reject it. Check the saved confirmation and next-work link.
4. Return to the queue and confirm the reviewed submission is absent.
5. Open overdue homework, then its student's overview. Follow each learning
   indicator and check all four quick actions retain the same student context.
6. Open a ready period: its program/period is selected, or an existing draft opens.
7. Create/update homework or a session, and generate/publish a report. Return to
   the overview/dashboard without a browser reload and check the updated reads.

Frontend requires the accompanying backend contract before runtime use. Both
PRs are intended for review; no deployment or automatic merge is part of M18.

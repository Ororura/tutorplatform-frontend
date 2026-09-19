# Teacher Homepage Design

## Intent

Create `/teacher` as the tutor's personal workspace: it should greet the authenticated teacher, show the students that can be opened immediately, expose the existing creation actions, and make the limits of the current backend explicit rather than inventing data.

The page must preserve the existing horizontal navigation, light visual language, authentication guards, App Router structure, FSD boundaries, generated OpenAPI types, and TanStack Query conventions.

## Existing System

- `getUserHome` already routes users with the `TEACHER` role to `/teacher` after authentication.
- `app/(teacher)/teacher/page.tsx` currently redirects `/teacher` to `/teacher/students`.
- `TeacherGuard` and `TeacherShell` already protect and frame all teacher routes.
- `CurrentUserResponse.displayName` supplies the teacher name.
- `GET /api/v1/teacher/students` supplies a paginated `StudentSummaryResponse` list.
- Existing dialogs implement student, learning-program, and task creation.
- Teacher submissions and homework can only be queried per student. The current response types do not contain enough information to build the requested cross-student attention list.

## Chosen Approach

Implement an honest partial homepage using only data available through bounded existing requests. The page will make one request for a limited student list and reuse the cached current-user query. It will not fan out submission, homework, program, or progress requests per student.

The attention section will display a neutral unavailable state explaining that the aggregate review and overdue-homework summary is not supported yet. It must not claim that all work is reviewed because the frontend cannot establish that fact.

The rejected alternative is per-student aggregation in the browser. It would create N+1 requests, load unnecessary history, produce partial results under failures, and violate the task constraints.

## Routing and Navigation

- Replace the redirect in `app/(teacher)/teacher/page.tsx` with `TeacherHomePage` from `_pages/teacher/home`.
- Keep `app/(teacher)/teacher/layout.tsx`, `TeacherGuard`, and `TeacherShell` unchanged.
- Add a `Главная` item linking to `/teacher` at the start of teacher navigation.
- Change the teacher-header brand link from `/teacher/students` to `/teacher`.
- Exact-path matching will mark only `/teacher` as the homepage; nested teacher routes keep their existing active state.

No authentication changes are needed because the existing role redirect already points teachers to `/teacher`.

## Page Composition

`TeacherHomePage` is a thin `_pages` composition. Its client-side view reads the current-user query and a student-list query with a small page size and deterministic sort. It renders three independent widgets:

1. `TeacherAttention` presents the section heading and the backend-unavailable state.
2. `TeacherStudentsOverview` owns presentation of student loading, error, empty, and success states. Successful cards show only `StudentSummaryResponse` fields: full name, student/account status, and a link to `/teacher/students/{studentId}`. Program, topic, and homework data are omitted because they are not available in the list contract.
3. `TeacherQuickActions` embeds the existing `CreateStudentDialog`, `CreateLearningProgramDialog`, and `CreateTaskDialog`, preserving their current mutation and form behavior.

The greeting uses `CurrentUserResponse.displayName`. While the user query is pending, the page shows a loading state rather than a fabricated fallback name. A current-user query error produces a recoverable error state.

## Visual Design

The page follows the existing refreshed teacher UI:

- light application background and white surfaces;
- rounded 28px sections, restrained borders, and low-opacity shadows;
- blue, indigo, emerald, and amber accents used for meaning rather than decoration;
- large greeting typography and short supporting copy;
- horizontal navigation only;
- a wide main column for attention and students, with quick actions beside it on large screens and below it on mobile;
- touch-friendly controls and stacked student cards on narrow screens.

The page contains no KPI tiles, charts, left sidebar, fabricated totals, or placeholder records.

## UI States

- **Page loading:** accessible `aria-busy` status while current user or initial student data is pending.
- **Current-user error:** explains that the workspace could not be loaded and offers a retry action.
- **Students error:** keeps the rest of the homepage usable and offers a student-list retry action.
- **No students:** explains that students have not been added and exposes the existing add-student action through quick actions.
- **Students available:** shows a limited overview plus a link to the complete student list.
- **Attention unavailable:** explicitly states that the backend does not yet provide a teacher-wide summary.
- **No review work / no overdue homework:** not asserted by this frontend version because the current API cannot prove either condition.

## Data and FSD Boundaries

- `app/` contains only the route entry point.
- `_pages/teacher/home` coordinates queries and widget props.
- `widgets/teacher-attention`, `widgets/teacher-students-overview`, and `widgets/teacher-quick-actions` contain standalone page blocks.
- Existing entity query factories and generated DTOs remain the only API/data definitions.
- Existing creation features remain responsible for mutations and dialogs.
- No generated OpenAPI file is edited, no dependency is added, and no new frontend API DTO is introduced.

## Testing

Component tests will cover:

- greeting with the authenticated teacher's real display name;
- initial loading;
- current-user error and retry;
- student-list error and retry;
- no students;
- student cards and detail links;
- attention-unavailable copy without the false all-clear message;
- all three existing quick-action triggers;
- homepage navigation active state and brand destination.

Implementation will follow test-first red/green cycles. Final validation will run, in order:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `graphify update .`
6. final diff and status review

## Required Backend Contract

A single bounded aggregate endpoint avoids N+1 and gives the frontend the facts needed for the complete design:

`GET /api/v1/teacher/home`

The generated response should contain:

- `needsReview[]`: submission ID, student ID, student display name, task ID, task title, homework ID, and submitted timestamp;
- `overdueHomeworks[]`: homework ID, student ID, student display name, homework title, and due timestamp;
- `students[]`: student ID, first name, last name, current program ID/title when present, current topic ID/title when present, and current homework ID/title/state when present.

Each collection should be explicitly bounded or paginated and sorted by urgency. Once this contract exists, the attention widget can render populated and verified-empty states, including the required message `Все работы проверены. Пока ничего не требует вашего внимания`, without changing the page architecture.

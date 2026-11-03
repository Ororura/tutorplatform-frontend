# shadcn/ui redesign — audit and delivery

## Scope and architecture

Audited on 2026-11-03. Next.js 16.4.2 / React 19 / TypeScript 5.9 / Tailwind CSS 4.1. Lucide, clsx and tailwind-merge already exist. No shadcn configuration or headless UI dependency existed.

FSD: `app` contains route adapters; `_app` owns providers and global CSS; `_pages` composes screens; `widgets` composes independent sections; `features` owns user actions, React Hook Form/Zod forms and mutations; `entities` owns query keys, API adapters and domain presentation; `shared/ui` owns domain-free primitives. Keep these boundaries and the generated OpenAPI schema.

Existing foundation: Button, form-controls, Badge, Surface, PageHeader, feedback, hand-written ActionMenu. Native dialogs are repeated across create/edit/import flows. Global CSS already uses semantic tokens; extend it into the shadcn token contract rather than adding a competing palette. Monaco and its local worker integration must stay intact.

Uncommitted user changes in code editor, typing/web-practice and student navigation were present before this work. They are excluded from redesign commits.

## Screen inventory

| Route                                                                        | Page adapter import                                                                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/admin/invitations`                                                         | export { AdminInvitationsPage as default } from "@/_pages/admin/invitations";                                    |
| `/admin`                                                                     | export { AdminDashboardPage as default } from "@/_pages/admin/dashboard";                                        |
| `/admin/settings`                                                            | export { AdminSettingsPage as default } from "@/_pages/admin/settings";                                          |
| `/login`                                                                     | export { LoginPage as default } from "@/_pages/auth/login";                                                      |
| `/register`                                                                  | export { TeacherRegisterPage as default } from "@/_pages/auth/teacher-register";                                 |
| `/invite/student/[token]`                                                    | import { AcceptStudentInvitePage } from "@/_pages/student/accept-invite";                                        |
| `/invite/teacher/[token]`                                                    | import { AcceptTeacherInvitePage } from "@/_pages/teacher/accept-invite";                                        |
| `/progress/[token]`                                                          | import { PublicProgressPage } from "@/_pages/public/progress";                                                   |
| `/reports/[token]`                                                           | import { PublicReportPage } from "@/_pages/public/report";                                                       |
| `/student/code-typing`                                                       | export { StudentCodeTypingPage as default } from "@/_pages/student/code-typing";                                 |
| `/student/homework/[homeworkId]`                                             | export { StudentHomeworkDetailPage as default } from "@/_pages/student/homework/detail";                         |
| `/student/homework`                                                          | export { StudentHomeworksPage as default } from "@/_pages/student/homework/list";                                |
| `/student`                                                                   | export { StudentLandingPage as default } from "@/_pages/student/landing";                                        |
| `/student/programs/[studentProgramId]`                                       | export { StudentProgramDetailPage as default } from "@/_pages/student/programs/detail";                          |
| `/student/programs/[studentProgramId]/topics/[topicId]`                      | export { StudentProgramTopicPage as default } from "@/_pages/student/programs/topic";                            |
| `/student/programs`                                                          | export { StudentProgramsPage as default } from "@/_pages/student/programs/list";                                 |
| `/student/progress`                                                          | export { StudentProgressPage as default } from "@/_pages/student/progress";                                      |
| `/student/web-practice`                                                      | export { StudentWebPracticePage as default } from "@/_pages/student/web-practice";                               |
| `/teacher`                                                                   | import { TeacherHomePage } from "@/_pages/teacher/home";                                                         |
| `/teacher/programs/[programId]`                                              | export { TeacherProgramDetailPage as default } from "@/_pages/teacher/programs/detail";                          |
| `/teacher/programs/[programId]/topics/[topicId]`                             | export { TeacherProgramTopicMaterialsPage as default } from "@/_pages/teacher/programs/topic/materials";         |
| `/teacher/programs`                                                          | export { TeacherProgramsPage as default } from "@/_pages/teacher/programs/list";                                 |
| `/teacher/students/[studentId]/homework/[homeworkId]/edit`                   | import { TeacherStudentHomeworkEditPage } from "@/_pages/teacher/students/detail/homeworks/edit";                |
| `/teacher/students/[studentId]/homework/[homeworkId]`                        | export { TeacherStudentHomeworkDetailPage as default } from "@/_pages/teacher/students/detail/homeworks/detail"; |
| `/teacher/students/[studentId]/homework/new`                                 | export { TeacherStudentHomeworkNewPage as default } from "@/_pages/teacher/students/detail/homeworks/new";       |
| `/teacher/students/[studentId]/homework`                                     | export { TeacherStudentHomeworksPage as default } from "@/_pages/teacher/students/detail/homeworks/list";        |
| `/teacher/students/[studentId]`                                              | export { TeacherStudentPage as default } from "@/_pages/teacher/students/detail/overview";                       |
| `/teacher/students/[studentId]/program`                                      | export { TeacherStudentProgramPage as default } from "@/_pages/teacher/students/detail/program/overview";        |
| `/teacher/students/[studentId]/programs/[studentProgramId]`                  | export { TeacherStudentProgramDetailPage as default } from "@/_pages/teacher/students/detail/program/detail";    |
| `/teacher/students/[studentId]/programs/[studentProgramId]/topics/[topicId]` | export { TeacherStudentTopicPage as default } from "@/_pages/teacher/students/detail/topic";                     |
| `/teacher/students/[studentId]/progress`                                     | export { TeacherStudentProgressPage as default } from "@/_pages/teacher/students/detail/progress";               |
| `/teacher/students/[studentId]/reports/[reportId]`                           | export { TeacherStudentReportDetailPage as default } from "@/_pages/teacher/students/detail/reports/detail";     |
| `/teacher/students/[studentId]/reports`                                      | export { TeacherStudentReportsPage as default } from "@/_pages/teacher/students/detail/reports";                 |
| `/teacher/students/[studentId]/sessions/[sessionId]/edit`                    | export { TeacherStudentSessionEditPage as default } from "@/_pages/teacher/students/detail/sessions/edit";       |
| `/teacher/students/[studentId]/sessions/[sessionId]`                         | export { TeacherStudentSessionDetailPage as default } from "@/_pages/teacher/students/detail/sessions/detail";   |
| `/teacher/students/[studentId]/sessions/new`                                 | export { TeacherStudentSessionNewPage as default } from "@/_pages/teacher/students/detail/sessions/new";         |
| `/teacher/students/[studentId]/sessions`                                     | export { TeacherStudentSessionsPage as default } from "@/_pages/teacher/students/detail/sessions/list";          |
| `/teacher/students`                                                          | export { TeacherStudentsPage as default } from "@/_pages/teacher/students/list";                                 |
| `/teacher/tasks/[taskId]`                                                    | export { TeacherTaskDetailPage as default } from "@/_pages/teacher/tasks/detail";                                |
| `/teacher/tasks`                                                             | export { TeacherTasksPage as default } from "@/_pages/teacher/tasks/list";                                       |
| `/`                                                                          | Root route                                                                                                       |

Public report components also exist in `_pages/public/report`; verify their route exposure before changing them. Materials are embedded in program topics; lesson sessions, reports and homework live under a student's profile. There is no global calendar route.

## Data available for the teacher home

`dashboardQueries.teacher()` provides active student count, submissions needing review, overdue homework, completed periods lacking a published report, and actionable attention items. Student summaries provide identity, lifecycle/account status and creation date. Do not invent a progress percentage, recent activity feed or upcoming-lesson list without an API supplying it.

## Delivery sequence

1. Audit and route inventory (this document).
2. Integrate shadcn source conventions and dependencies; shared Button, Card, controls, Skeleton, Dialog/Sheet and AlertDialog-based ConfirmDialog. Extend semantic CSS tokens, preserve public component APIs during migration.
3. Unified responsive App Shell: desktop sidebar, mobile Sheet, role-specific navigation and session actions.
4. Teacher home, student directory/profile, programs/editor/materials, tasks/homework/sessions/reports.
5. Student workspace, programs/topics, homework/Monaco practice, progress.
6. Authentication, registration and invitations/public pages.
7. Remove unused legacy implementations after reference checks.
8. Typecheck, lint, unit tests, production build; real-backend Playwright journeys and visual checks at 1440×900, 1280×800, 768×1024 and 390×844.

## Existing verification

Vitest covers domain/query logic and UI behavior (141 test files at audit). Playwright covers sessions, student CRUD/invitations, program editing/assignment, materials, lessons, homework, execution, progress/reports, security and mobile. Existing layout assertions encode the former horizontal header and need updating when the sidebar lands. API-mocked layout tests are useful for edge cases but must not be presented as real API workflow validation.

## Design decisions

Light neutral workspace, blue primary actions/current navigation, system font, 8px layout rhythm, restrained 8–12px radii, quiet borders, shadows for overlays. Reuse native select and checkbox controls where they preserve form behavior and keyboard support. Radix owns focus trapping, Escape dismissal and return focus for newly migrated dialogs. Business mutations stay in their feature slices.

References: [shadcn Next.js integration](https://ui.shadcn.com/docs/installation/next), [shadcn theming](https://ui.shadcn.com/docs/theming).

## Status

- Audit complete; implementation and verification recorded below as stages finish.

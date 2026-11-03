# shadcn/ui migration — verified working stage

Date: 2026-11-03. Branch: `feat/shadcn-ui-redesign`. No push or merge.

## Delivered

| Area                       | Changes                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All role workspaces        | Single AppShell, desktop sidebar, mobile Radix Sheet, active routes, role-gated workspace switching, account/logout, skip link. Existing session guards stay in route layouts.                                            |
| Teacher home               | API-backed metrics, review/overdue/report queue, shared student rows, quick actions near the top on mobile. No invented lessons, activity or progress metrics.                                                            |
| Students                   | Search and API filters preserved, reset action, aligned list columns and responsive rows, unified query states. Profile header, learning section navigation, account/access cards and invitation revocation confirmation. |
| Programs                   | Search/status filters over the complete loaded catalog; shared domain status badge; create dialog; readable module/topic hierarchy and existing reordering/bulk operations.                                               |
| Materials                  | Topic header, skeleton/empty states and shared material cards for all existing types. Existing renderer, safe Markdown and all editing/upload contracts retained.                                                         |
| Student home/program cards | Homework first, actual deadlines and topic completion, compact program actions; redundant motivation panel removed.                                                                                                       |
| Code practice              | Existing Monaco and execution hooks retained. Editor and run/submit toolbar grouped; pending controls, results/errors and submission history retained. Long Python guidance is expandable.                                |
| Authentication             | Shared AuthShell for login, teacher registration, student invitation and teacher invitation, including unavailable/pending states. Registration modes and role redirects retained.                                        |

## Components and architecture

Configured `components.json` for Tailwind 4, CSS variables, Lucide and FSD aliases. Adapted shadcn source conventions into the existing shared layer. Added Card family, Skeleton, Dialog, Sheet, DropdownMenu, AlertDialog-based ConfirmDialog and AuthShell. Extended existing Button, form-controls, Badge, PageHeader, feedback and Surface rather than keeping two separate palettes/APIs. `Surface` is a compatibility entry point backed by Card.

Added only used dependencies: Radix Slot/Dialog/AlertDialog/DropdownMenu, class-variance-authority and tw-animate-css. The existing clsx/tailwind-merge/Lucide installation remains in use. See [official integration](https://ui.shadcn.com/docs/installation/next) and [theming](https://ui.shadcn.com/docs/theming).

Deleted the obsolete TeacherHeader, StudentHeader, AdminHeader, TeacherShell, StudentShell and AdminShell widgets and their header tests. Replaced duplicated navigation implementations and custom menu keyboard positioning code with the unified shell/Radix. Removed unused global header selectors. Native dialogs and legacy semantic classes still referenced by other flows remain until those flows are migrated.

Domain status presentation lives in `entities/learning-program`; role composition lives in `widgets/app-shell`; domain-free primitives live in `shared/ui`. API schemas, TanStack Query contracts, providers/session logic and backend/worker source were not changed. Monaco and pre-existing changes to typing/web-practice/student navigation were preserved.

## Validation

- `npm run typecheck`: passed.
- `npm run lint`: passed, no warnings.
- `npm run test`: 142 test files / 662 tests passed.
- `npm run build`: production build passed.
- Final main Playwright batch: 19 passed. Covers student invitation, real Docker code execution, all editable material types including cancellation/focus/error recovery, program create/edit/reorder/activate/archive, TEXT+CODE homework and review, visual role/admin/public flows, contrast, loading/failure/retry/empty states, and keyboard navigation.
- Additional successful real-backend journeys: login/logout session invalidation, student creation/view/invitation, program assignment, student learning journey and teacher/student/public current progress.
- Additional program regression checks: URL compatibility, independent copies and both content-import workflows passed (4 tests). Long-content/bulk-toolbar/menu keyboard checks passed at 1440, 1024, 768 and 375px (4 tests). Final mobile dashboard visual journey passed again after action ordering was adjusted.
- `graphify update .`: AST graph refreshed.
- Final diff reviewed; original dirty tracked files compared with the initial patch and preserved (including restoring generated `next-env.d.ts`).

The real checks used the existing local PostgreSQL/worker Compose services, the built backend JAR with `dev,demo`, and the development frontend. Backend or worker implementation was not modified. Screenshots were captured with real demo data at 1440×900, 1280×800, 768×1024 and 390×844. Long-content edge cases, some admin fixtures and query failure states deliberately use Playwright API fixtures; these are not substitutes for the real backend journeys.

Execution E2E supports `EXECUTION_E2E_COMPOSE_FILE` so its evidence is read from the worker actually serving the app. The default remains the isolated `.github/e2e/compose.yml`; this local run used `../compose.yml`. The run/submit assertions still validate real backend responses and match the backend execution ID to DockerSandboxRuntime logs.

Layout and component tests were updated to use accessible roles for portal menus, disabled menu semantics, multiple page headers and the new card hierarchy. The original assertions for ordering, mutations, focus restoration and persisted data remain.

## Remaining work

This is not a completed redesign of every route. The following require a separate UX pass, even though shared tokens/controls/shell already apply:

- Teacher task-bank/detail screens and their create/edit forms.
- Homework list/detail/create/edit pages for both roles (the shared solution editor was migrated).
- Lesson/session list/detail/forms and assessment presentation.
- Teacher/student progress and report management; public progress/report layouts.
- Student program detail/topic layouts and progress screens.
- Admin dashboard/settings/invitation management page structures.
- Remaining program/module/topic/material create/edit/upload/import/assignment dialogs and any still-used legacy CSS.
- Typing/web-practice screens: pre-existing user changes were intentionally left outside the migration commits.

Do not remove the remaining `.surface`, `.field-control`, `.dialog-surface` or compatibility tokens until their callers are migrated. Re-run relevant real workflows per slice, then the full frontend checks. No scheduled-lesson summary was added: the current teacher dashboard contract does not supply it.

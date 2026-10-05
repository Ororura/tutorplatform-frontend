# UI verification — Умнее Вместе

## Design and scope

The existing design-token file now owns the neutral surfaces, blue accent, semantic statuses, contrast-safe text/control colors, typography, widths, radii, spacing, focus and floating elevation. Teacher, student, admin, authentication and public pages use that foundation. Native controls and dialogs, route URLs, generated API types, domain logic, session guards and CSP are preserved. No dependency or external asset was added.

The audit and migration decisions are in [the refactor plan](../ui-refactor-plan.md). Shared Button, native form controls, Badge, PageHeader, Surface, application brand and feedback patterns replace repeated styling. Navigation uses a flat sticky application header. Teacher metrics and student sections rely on hierarchy instead of nested decorative cards; authentication uses a compact focused form.

## Rendered verification

Playwright exercised 375, 768, 1280 and 1440px against a local production build. Teacher screenshots cover dashboard, students, student detail, programs, editor, task bank, homework/review and a program dialog. Student screenshots cover dashboard, programs, program contents, topic, task solution and progress. The real student journey additionally verifies code editing at 375 and 1440px, submission and accepted results. Admin dashboard/settings use isolated rendering fixtures; public progress/report use local seeded demo records. Live admin authorization or platform-setting writes were not performed.

Checks cover document overflow, long unbroken titles, keyboard navigation, visible focus, native radio focus, dialog bounds/Escape/focus return, reduced motion, twelve semantic contrast pairs, actual rendered input-border contrast, and loading/failure/retry/empty feedback. Horizontal scrolling remains intentional within mobile navigation and code/data regions.

Screenshot review caught and corrected dark default separators, inline code inheriting unreadable colors, an overlarge current-program title unnecessary nested topic-navigation surfaces, and auth inputs overriding the shared contrast-safe border. Session reuse keeps viewport checks within the backend authentication rate limit. CSP tests retain image coverage using a test-only same-origin image rather than depending on a decorative dashboard mascot.

## Quality gate

Passed: `npm run format`, `npm run lint:tailwind`, `npm run lint`, `npm run typecheck`, `npm test` (134 files / 621 tests), `npm run build`.

Passed 28 production Playwright checks and four additional real-backend workflow tests (32 distinct tests). The production Playwright selection covers visual/system checks, program/workspace layouts, mobile flows, authentication/reload/logout, real program reads, CSP nonces and enforcement, same-origin code run/submission, headers and public PDF download. Separate real-backend tests cover program creation/edit/reorder/activation/archive, editable material types, TEXT/CODE homework and review/resubmission, and the complete student learning journey.

Independent review found no actionable regressions in shared controls, native dialogs, Markdown sanitization, imports or code-editor behavior. `git diff --check` passes. `graphify update .` refreshed the code graph; its optional SQL parser remains unavailable, unrelated to frontend verification.

## Evidence

- [Desktop overview](desktop-overview.png)
- [Mobile overview](mobile-overview.png)
- [Teacher program editor](after/teacher-program-editor-1440.png)
- [Student code solution](after/student-code-solution-375.png)
- [Loading/error/empty feedback](feedback-overview.png)
- [Earlier program layout, desktop](before/program-desktop.png) / [mobile](before/program-mobile.png)

The code-editor evidence is a focused crop of the full mobile screenshot; overview sheets crop the top of each screen for comparison.

## Remaining debt

Specialized domain forms and editor toolbars retain local structural layout classes and native-dialog markup. They use shared controls and semantic styling; extracting a larger framework would not improve this refactor. Admin save behavior is covered by existing automated tests, while browser QA uses a read-only admin fixture. Future feature work should continue to reuse the primitives and token scale.

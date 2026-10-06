# Умнее Вместе — UI refactor plan

## Audit

The App Router routes are thin bridges into the existing Feature-Sliced layers. Keep query/mutation logic, routes, API schemas, session guards, CSP, demo behavior and native dialog behavior intact.

The existing `src/_app/styles/globals.css` provides the foundation, but 111 page/feature/entity files bypass it with raw palettes. Repeated controls have different heights, borders and focus treatment. Status badges use inconsistent colors, shapes and type sizes. More than 200 major surfaces use `rounded-2xl`; nested surfaces obscure hierarchy. Teacher/student navigation floats in decorative cards, while admin uses different widths and spacing. Login resembles a marketing page. Query states are duplicated. Wide shells have no intentional relationship to readable content widths.

## Design direction

Calm, compact educational workspace. Preserve the name, system font and blue brand. Use neutral surfaces, clear headings, visible focus and quiet separators. Blue identifies the primary action and current navigation; status colors communicate outcomes with text. No decorative gradients or motion. Shadows belong to menus and dialogs. Keep comfortable mobile controls and natural text wrapping.

UI UX Pro Max's flat-design guidance supports restraint and simple feedback. Its generated landing pattern, teal palette and external font do not fit this existing product and are not adopted. Frontend Design Codex supplies the rendered screenshot/iteration workflow; Frontend UI Standards supplies token/component/layout separation.

## Foundations (extend the existing CSS file)

- Colors: background, surface, surface-subtle, surface-hover; foreground, foreground-muted, foreground-subtle; border, border-strong; primary, primary-hover, primary-subtle, primary-foreground; success/warning/danger with subtle backgrounds and borders; code surface/text, overlay, focus-ring. Existing app-background/surface-muted/text-primary/text-secondary aliases remain compatible.
- Type: caption 12/16, body/label/metadata 14/20, reading/input 16/24, card title 16/24, section title 18/28, page title 24/32 (28/36 on desktop). Semibold headings; regular descriptions. Tabular figures for metrics.
- Spacing: 4/8/12/16/24/32; page gutters 16 mobile / 24 tablet / 32 desktop; section gap 24; surface padding 16 mobile / 24 desktop; controls 40 desktop / 44 touch, gap 8.
- Radius: control 6px, inset 8px, surface 10px, dialog 12px. Pills reserved for badges and avatars.
- Width: workspace 1280px, editor/data up to 1440px when needed, content 1024px, reading 768px, form 640px, auth 448px.
- Elevation: normal surfaces none, dropdown/dialog shared floating shadow. Focus 2px outline plus offset; reduced motion disables non-essential transitions/pulsing.

## Component strategy

Keep the existing Button API and four variants. Add loading support and reusable class helpers for anchors. Introduce small native Input/Textarea/Select controls and shared field styling, Badge tone classes, PageHeader, Surface, and feedback states only where reused. Reuse native inputs, selects, checkboxes, radios and dialogs; do not introduce a UI dependency or a modal state framework. Extract shared navigation styling/brand without merging role behavior. Migrate repeated exact styling patterns to shared CSS component classes; retain local structural layout classes.

## Migration order

1. Tokens, type/spacing/radius/width foundations and shared controls.
2. Teacher/student/admin shells and role navigation, then student profile tabs.
3. Teacher dashboard, students/task/program lists, program editor and dialogs.
4. Student dashboard, learning program/topic/task solution, homework and progress.
5. Remaining feature forms, sessions, reviews/reports, public pages, auth and admin.
6. Remove redundant palette/radius/control/surface strings, preserve code/editor geometry.
7. Render screenshots at 375/768/1280/1440px; inspect long content, navigation, dialogs, form states, tables and code. Exercise existing keyboard/layout tests and add a cross-role visual regression fixture where necessary.

## Verification

Run format, Tailwind lint, ESLint, typecheck, unit tests, build and relevant Playwright checks. Inspect the final diff and maintain the graph with `graphify update .`. Backend-dependent checks require the local demo backend; fixtures verify frontend rendering and interactions independently and must be described as such.

# Teacher Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/teacher` redirect with a tested, responsive teacher workspace built from current-user data, one bounded student-list query, existing creation dialogs, and an honest unavailable state for unsupported attention data.

**Architecture:** The App Router entry delegates to an FSD `_pages` composition. The composition owns TanStack Query state and passes generated entity data into three focused widgets for attention, students, and quick actions; the existing teacher shell, guards, entity queries, and feature dialogs remain unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, TanStack Query 5, Vitest, Testing Library, generated OpenAPI types.

**Spec:** `docs/superpowers/specs/2026-09-19-teacher-homepage-design.md`

## Global Constraints

- Frontend only; do not edit backend files or generated OpenAPI schema.
- Do not add dependencies or define replacement API DTOs.
- Do not issue per-student submission, homework, program, or progress requests.
- Use only real current-user and student-list data; never fabricate names, programs, topics, homework, counts, or all-clear attention status.
- Preserve `TeacherGuard`, `TeacherShell`, current authentication behavior, and horizontal navigation.
- Follow FSD: `app/` routes, `_pages/` composition, `widgets/` blocks, existing `entities/` queries, existing `features/` actions.
- Create no intermediate implementation commits. After every requested validation succeeds, create the user-requested commit `feat(teacher): implement teacher homepage`.

## Review Focus

- Root navigation matching: `/teacher` is active only on the homepage, while nested routes activate only their existing section.
- Nullable student last name: cards remain readable and contain no `undefined`, duplicated spaces, or empty accessible names.
- Partial data failure: a failed student request does not hide the greeting, attention explanation, or quick actions.
- Authentication query anomalies: pending, error, and `null` user data never produce a hardcoded or blank teacher name.
- Pagination boundary: the overview states when more students exist and links to the full list without fetching another page.

---

### Task 1: Make `/teacher` a first-class navigation destination

**Files:**
- Modify: `src/widgets/teacher-header/ui/teacher-header.test.tsx`
- Modify: `src/widgets/teacher-header/ui/teacher-header.tsx`

**Interfaces:**
- Consumes: `usePathname(): string` and the existing teacher navigation model.
- Produces: desktop/mobile links named `Главная` with `href="/teacher"`; the brand link also targets `/teacher`; root-only active matching for that link.

- [ ] **Step 1: Write failing navigation tests**

Replace the fixed pathname mock with mutable hoisted state and add assertions:

```tsx
const { roles, route } = vi.hoisted(() => ({
  roles: { current: ["TEACHER"] as string[] },
  route: { current: "/teacher/students/student-1" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => route.current,
}));

it("links the brand and homepage navigation to the teacher workspace", () => {
  route.current = "/teacher";
  render(<TeacherHeader />);

  expect(screen.getByRole("link", { name: /Умнее Вместе/ })).toHaveAttribute("href", "/teacher");
  const homeLinks = screen.getAllByRole("link", { name: /Главная/ });
  expect(homeLinks).toHaveLength(2);
  expect(homeLinks.every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
});

it("does not mark the homepage active on a nested teacher route", () => {
  route.current = "/teacher/students/student-1";
  render(<TeacherHeader />);

  expect(screen.getAllByRole("link", { name: /Главная/ }).some((link) => link.hasAttribute("aria-current"))).toBe(false);
  expect(screen.getAllByRole("link", { name: /Ученики/ }).some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
});
```

Reset `route.current` in `afterEach` alongside roles.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/widgets/teacher-header/ui/teacher-header.test.tsx`

Expected: FAIL because no `Главная` links exist and the brand still targets `/teacher/students`.

- [ ] **Step 3: Implement root navigation**

Add `House` to the Lucide imports and prepend:

```tsx
{
  href: "/teacher",
  label: "Главная",
  icon: House,
},
```

Use exact matching for the root and keep prefix matching for sections:

```tsx
function isActivePath(pathname: string, href: string) {
  if (href === "/teacher") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

Change the brand `Link` href to `/teacher`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/widgets/teacher-header/ui/teacher-header.test.tsx`

Expected: all teacher-header tests pass.

---

### Task 2: Add standalone homepage widgets

**Files:**
- Create: `src/widgets/teacher-attention/index.ts`
- Create: `src/widgets/teacher-attention/ui/teacher-attention.tsx`
- Create: `src/widgets/teacher-attention/ui/teacher-attention.test.tsx`
- Create: `src/widgets/teacher-students-overview/index.ts`
- Create: `src/widgets/teacher-students-overview/ui/teacher-students-overview.tsx`
- Create: `src/widgets/teacher-students-overview/ui/teacher-students-overview.test.tsx`
- Create: `src/widgets/teacher-quick-actions/index.ts`
- Create: `src/widgets/teacher-quick-actions/ui/teacher-quick-actions.tsx`
- Create: `src/widgets/teacher-quick-actions/ui/teacher-quick-actions.test.tsx`

**Interfaces:**
- Consumes: existing `StudentPage`, status-label helpers, and three existing dialog components.
- Produces: `TeacherAttention()`, `TeacherStudentsOverview(props)`, and `TeacherQuickActions()` exports.

- [ ] **Step 1: Write the failing attention test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeacherAttention } from "./teacher-attention";

describe("TeacherAttention", () => {
  it("explains that the aggregate is unavailable without claiming an all-clear", () => {
    render(<TeacherAttention />);
    expect(screen.getByRole("heading", { name: "Требует внимания" })).toBeInTheDocument();
    expect(screen.getByText(/сводка по работам пока недоступна/i)).toBeInTheDocument();
    expect(screen.queryByText("Все работы проверены. Пока ничего не требует вашего внимания")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify the attention test fails**

Run: `npm test -- src/widgets/teacher-attention/ui/teacher-attention.test.tsx`

Expected: FAIL because the widget module does not exist.

- [ ] **Step 3: Implement the attention widget and public export**

Render a restrained amber-accented white section with the exact heading and explanatory copy. Include no fabricated list items, counts, buttons, or all-clear text:

```tsx
import { CircleAlert } from "lucide-react";

export function TeacherAttention() {
  return (
    <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <CircleAlert size={20} />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Требует внимания</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Сводка по работам пока недоступна: текущий API не позволяет получить ожидающие проверки и просроченные домашние задания без отдельных запросов по каждому ученику.
          </p>
        </div>
      </div>
    </section>
  );
}
```

Export it from `index.ts`:

```ts
export { TeacherAttention } from "./ui/teacher-attention";
```

- [ ] **Step 4: Verify the attention test passes**

Run: `npm test -- src/widgets/teacher-attention/ui/teacher-attention.test.tsx`

Expected: PASS.

- [ ] **Step 5: Write failing student-overview tests**

Use a `next/link` anchor mock and a `StudentPage` fixture with `totalElements: 8` and two items. Cover all four states and nullable names:

```tsx
it("renders a loading state", () => {
  render(<TeacherStudentsOverview isPending isError={false} onRetry={vi.fn()} />);
  expect(screen.getByText("Загружаем учеников…")).toHaveAttribute("aria-busy", "true");
});

it("keeps an error recoverable", () => {
  const retry = vi.fn();
  render(<TeacherStudentsOverview isPending={false} isError onRetry={retry} />);
  fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
  expect(retry).toHaveBeenCalledOnce();
});

it("renders the empty state", () => {
  render(<TeacherStudentsOverview isPending={false} isError={false} data={{ items: [], page: 0, size: 6, totalElements: 0, totalPages: 0 }} onRetry={vi.fn()} />);
  expect(screen.getByText("Учеников пока нет")).toBeInTheDocument();
});

it("renders real summaries, nullable names, detail links, and the full-list link", () => {
  render(<TeacherStudentsOverview isPending={false} isError={false} data={studentPage} onRetry={vi.fn()} />);
  expect(screen.getByText("Анна Смирнова")).toBeInTheDocument();
  expect(screen.getByText("Максим")).toBeInTheDocument();
  expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Открыть Анна Смирнова/ })).toHaveAttribute("href", "/teacher/students/student-1");
  expect(screen.getByRole("link", { name: /Все ученики/ })).toHaveAttribute("href", "/teacher/students");
  expect(screen.getByText("Показаны последние 2 из 8")).toBeInTheDocument();
});
```

The props signature is:

```ts
type Props = {
  data?: StudentPage;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};
```

- [ ] **Step 6: Verify the student-overview tests fail**

Run: `npm test -- src/widgets/teacher-students-overview/ui/teacher-students-overview.test.tsx`

Expected: FAIL because the widget module does not exist.

- [ ] **Step 7: Implement the student overview and public export**

Use `getStudentStatusLabel` and `getStudentAccountStatusLabel` for real status labels. Build display names with `[firstName, lastName].filter(Boolean).join(" ")`. Implement the state order and real-data mapping with this component body:

```tsx
export function TeacherStudentsOverview({ data, isPending, isError, onRetry }: Readonly<Props>) {
  let content: ReactNode;

  if (isPending) {
    content = <p aria-busy="true" className="py-8 text-sm text-slate-500">Загружаем учеников…</p>;
  } else if (isError) {
    content = (
      <div role="alert" className="py-8">
        <p className="text-sm text-red-700">Не удалось загрузить учеников.</p>
        <Button className="mt-4" type="button" variant="secondary" onClick={onRetry}>Повторить</Button>
      </div>
    );
  } else if (!data || data.items.length === 0) {
    content = <p className="py-8 text-sm text-slate-500">Учеников пока нет</p>;
  } else {
    content = (
      <>
        <ul className="divide-y divide-slate-100">
          {data.items.map((student) => {
            const name = [student.firstName, student.lastName].filter(Boolean).join(" ");
            return (
              <li key={student.id} className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {getStudentStatusLabel(student.status)} · {getStudentAccountStatusLabel(student.accountStatus)}
                    </p>
                  </div>
                  <Link className="text-sm font-medium text-blue-600" href={`/teacher/students/${student.id}`} aria-label={`Открыть ${name}`}>
                    Открыть
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        {data.totalElements > data.items.length && (
          <p className="mt-4 text-xs text-slate-500">Показаны последние {data.items.length} из {data.totalElements}</p>
        )}
        <Link className="mt-5 inline-flex text-sm font-medium text-blue-600" href="/teacher/students">Все ученики</Link>
      </>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">Мои ученики</h2>
      {content}
    </section>
  );
}
```

The widget must therefore provide:

- a semantic section headed `Мои ученики`;
- accessible loading and alert states;
- a retry `Button` on error;
- an empty explanation without fake cards;
- responsive student rows/cards with `/teacher/students/{id}` links;
- `Показаны последние X из Y` only when `totalElements > items.length`;
- a persistent `Все ученики` link when data is non-empty.

Export from `index.ts`:

```ts
export { TeacherStudentsOverview } from "./ui/teacher-students-overview";
```

- [ ] **Step 8: Verify the student-overview tests pass**

Run: `npm test -- src/widgets/teacher-students-overview/ui/teacher-students-overview.test.tsx`

Expected: PASS.

- [ ] **Step 9: Write the failing quick-actions test**

Mock each existing feature dialog as a named button, render the widget, and assert all triggers:

```tsx
expect(screen.getByRole("heading", { name: "Быстрые действия" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Добавить ученика" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Создать программу" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Создать задание" })).toBeInTheDocument();
```

- [ ] **Step 10: Verify the quick-actions test fails**

Run: `npm test -- src/widgets/teacher-quick-actions/ui/teacher-quick-actions.test.tsx`

Expected: FAIL because the widget module does not exist.

- [ ] **Step 11: Implement quick actions and public export**

Render a white section headed `Быстрые действия` and embed the existing dialogs without reimplementing their state or mutations:

```tsx
export function TeacherQuickActions() {
  return (
    <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6 xl:sticky xl:top-28 xl:self-start">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">Быстрые действия</h2>
      <div className="mt-5 flex flex-col items-stretch gap-3">
        <CreateStudentDialog />
        <CreateLearningProgramDialog />
        <CreateTaskDialog />
      </div>
    </section>
  );
}
```

Export it from `index.ts`:

```ts
export { TeacherQuickActions } from "./ui/teacher-quick-actions";
```

- [ ] **Step 12: Run all widget tests**

Run:

```bash
npm test -- \
  src/widgets/teacher-attention/ui/teacher-attention.test.tsx \
  src/widgets/teacher-students-overview/ui/teacher-students-overview.test.tsx \
  src/widgets/teacher-quick-actions/ui/teacher-quick-actions.test.tsx
```

Expected: all new widget tests pass.

---

### Task 3: Compose the homepage and replace the redirect

**Files:**
- Create: `src/_pages/teacher/home/index.ts`
- Create: `src/_pages/teacher/home/ui/teacher-home-page.tsx`
- Create: `src/_pages/teacher/home/ui/teacher-home-page.test.tsx`
- Modify: `app/(teacher)/teacher/page.tsx`

**Interfaces:**
- Consumes: `useCurrentUserQuery()`, `studentQueries.list({ page: 0, size: 6, sort: "createdAt,desc" })`, and all three homepage widgets.
- Produces: `TeacherHomePage()` exported through `_pages/teacher/home`; `/teacher` renders it directly.

- [ ] **Step 1: Write failing page-composition tests**

Mock `useCurrentUserQuery`, TanStack `useQuery`, `studentQueries.list`, and the three widgets. Keep query results mutable. Assert:

```tsx
it("greets the authenticated teacher and requests a bounded student overview", () => {
  render(<TeacherHomePage />);
  expect(screen.getByRole("heading", { name: "Добрый день, Елена!" })).toBeInTheDocument();
  expect(mocks.list).toHaveBeenCalledWith({ page: 0, size: 6, sort: "createdAt,desc" });
  expect(screen.getByText("attention-widget")).toBeInTheDocument();
  expect(screen.getByText("students-widget")).toBeInTheDocument();
  expect(screen.getByText("actions-widget")).toBeInTheDocument();
});

it("shows a page loading state without a fabricated name", () => {
  mocks.currentUser.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: mocks.refetchUser });
  render(<TeacherHomePage />);
  expect(screen.getByText("Загружаем рабочее пространство…")).toHaveAttribute("aria-busy", "true");
  expect(screen.queryByText(/Добрый день/)).not.toBeInTheDocument();
});

it("allows retry after a current-user error", () => {
  mocks.currentUser.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch: mocks.refetchUser });
  render(<TeacherHomePage />);
  fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
  expect(mocks.refetchUser).toHaveBeenCalledOnce();
});

it("does not invent a greeting when guard data is unexpectedly null", () => {
  mocks.currentUser.mockReturnValue({ data: null, isPending: false, isError: false, refetch: mocks.refetchUser });
  render(<TeacherHomePage />);
  expect(screen.queryByText(/Добрый день/)).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить профиль преподавателя");
});
```

Make the mocked student widget expose `isPending`, `isError`, and invoke `onRetry`; verify those exact query values are forwarded so a student error does not replace the greeting or other widgets.

- [ ] **Step 2: Run the page test and verify RED**

Run: `npm test -- src/_pages/teacher/home/ui/teacher-home-page.test.tsx`

Expected: FAIL because the page module does not exist.

- [ ] **Step 3: Implement the page composition**

Create a client component with one bounded student request:

```tsx
"use client";

const studentListParams = { page: 0, size: 6, sort: "createdAt,desc" } as const;

export function TeacherHomePage() {
  const currentUser = useCurrentUserQuery();
  const students = useQuery(studentQueries.list(studentListParams));

  if (currentUser.isPending) return <TeacherHomeLoading />;
  if (currentUser.isError || !currentUser.data) {
    return <TeacherHomeError onRetry={() => currentUser.refetch()} />;
  }

  return (
    <main className="space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-8">
        <p className="text-sm font-medium text-blue-600">Рабочее пространство</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Добрый день, {currentUser.data.displayName}!
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Здесь собраны ученики и быстрые действия для ежедневной работы.
        </p>
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <TeacherAttention />
          <TeacherStudentsOverview
            data={students.data}
            isPending={students.isPending}
            isError={students.isError}
            onRetry={() => students.refetch()}
          />
        </div>
        <TeacherQuickActions />
      </div>
    </main>
  );
}
```

Use existing surface classes from teacher pages. `TeacherHomeLoading` must use `aria-busy="true"`; `TeacherHomeError` must use `role="alert"` and the shared `Button`.

Export from `src/_pages/teacher/home/index.ts`:

```ts
export { TeacherHomePage } from "./ui/teacher-home-page";
```

- [ ] **Step 4: Replace the route redirect**

Replace the contents of `app/(teacher)/teacher/page.tsx` with:

```tsx
import { TeacherHomePage } from "@/_pages/teacher/home";

export default function Page() {
  return <TeacherHomePage />;
}
```

- [ ] **Step 5: Run the page test and verify GREEN**

Run: `npm test -- src/_pages/teacher/home/ui/teacher-home-page.test.tsx`

Expected: all homepage tests pass.

- [ ] **Step 6: Run all directly affected tests**

Run:

```bash
npm test -- \
  src/widgets/teacher-header/ui/teacher-header.test.tsx \
  src/widgets/teacher-attention/ui/teacher-attention.test.tsx \
  src/widgets/teacher-students-overview/ui/teacher-students-overview.test.tsx \
  src/widgets/teacher-quick-actions/ui/teacher-quick-actions.test.tsx \
  src/_pages/teacher/home/ui/teacher-home-page.test.tsx
```

Expected: all affected tests pass without warnings.

---

### Task 4: Validate, update the graph, review, and commit

**Files:**
- Modify automatically: `graphify-out/` if the frontend repository owns graph output; otherwise run the command from the parent project and do not copy unrelated graph files into the frontend commit.
- Review: every file changed since `origin/main`.

**Interfaces:**
- Consumes: completed tasks 1–3.
- Produces: verified branch and final commit `feat(teacher): implement teacher homepage`.

- [ ] **Step 1: Run formatting check on changed source**

Run `npx prettier --check app/'(teacher)'/teacher/page.tsx src/_pages/teacher/home src/widgets/teacher-attention src/widgets/teacher-students-overview src/widgets/teacher-quick-actions src/widgets/teacher-header/ui/teacher-header.tsx src/widgets/teacher-header/ui/teacher-header.test.tsx`.

If it fails, run Prettier only on those paths, then rerun the check.

- [ ] **Step 2: Run the requested typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 3: Run the requested lint**

Run: `npm run lint`

Expected: exit 0.

- [ ] **Step 4: Run the complete requested test suite**

Run: `npm run test`

Expected: exit 0 with all existing and new tests passing.

- [ ] **Step 5: Run the requested production build**

Run: `npm run build`

Expected: exit 0 and `/teacher` appears as a built route.

- [ ] **Step 6: Update the project graph**

From `/Users/egorgladkikh/Desktop/tutor-learning-platform`, run:

```bash
graphify update .
```

Review graph changes and include only frontend-related generated changes if `graphify-out` is tracked by the same Git repository. The current project uses separate nested repositories, so graph output outside `frontend/.git` must not be staged in the frontend commit.

- [ ] **Step 7: Review repository state and diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff -- app src docs
git diff --stat origin/main...HEAD
```

Confirm generated schema, package manifests, backend files, and unrelated current-branch files are unchanged.

- [ ] **Step 8: Commit only after successful verification**

Stage the implementation, tests, and plan document, excluding any unrelated files:

```bash
git add app/'(teacher)'/teacher/page.tsx \
  src/_pages/teacher/home \
  src/widgets/teacher-attention \
  src/widgets/teacher-students-overview \
  src/widgets/teacher-quick-actions \
  src/widgets/teacher-header/ui/teacher-header.tsx \
  src/widgets/teacher-header/ui/teacher-header.test.tsx \
  docs/superpowers/plans/2026-09-19-teacher-homepage.md
git commit -m "feat(teacher): implement teacher homepage"
```

- [ ] **Step 9: Record final evidence**

Run:

```bash
git status --short --branch
git rev-parse --short HEAD
git show --stat --oneline --summary HEAD
```

Report implemented behavior, changed files, exact results for typecheck/lint/test/build, missing backend data, and the final commit hash. Do not push.

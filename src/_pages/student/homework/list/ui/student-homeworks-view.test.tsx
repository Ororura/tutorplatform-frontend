import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StudentHomeworkSummary } from "@/entities/homework";

import { StudentHomeworksView } from "./student-homeworks-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), useInfiniteQuery: vi.fn(), useQueries: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  useQueries: mocks.useQueries,
  useInfiniteQuery: mocks.useInfiniteQuery,
  queryOptions: (value: unknown) => value,
  infiniteQueryOptions: (value: unknown) => value,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const base: StudentHomeworkSummary = {
  id: "assigned",
  studentProgramId: "program-1",
  title: "Будущая работа",
  status: "ASSIGNED",
  assignedAt: "2026-09-01T10:00:00Z",
  dueAt: "2026-10-03T15:00:00Z",
  overdue: false,
  itemsCount: 4,
  createdAt: "2026-09-01T10:00:00Z",
};
const items: StudentHomeworkSummary[] = [
  { ...base, id: "overdue", title: "Просроченная работа", dueAt: "2026-09-24T15:00:00Z" },
  base,
  {
    ...base,
    id: "completed",
    title: "Готовая работа",
    status: "COMPLETED",
    dueAt: "2026-09-20T15:00:00Z",
    completedAt: "2026-09-25T10:00:00Z",
  },
  { ...base, id: "cancelled", title: "Отменённая работа", status: "CANCELLED" },
];
const now = new Date("2026-09-30T12:00:00Z");
const results = new Map<string, ReturnType<typeof result>>();
function result(homeworks: StudentHomeworkSummary[]) {
  return {
    data: { pages: [{ items: homeworks, page: 0, size: 20, totalPages: 1, totalElements: homeworks.length }] },
    isPending: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
  };
}
function setItems(homeworks: StudentHomeworkSummary[]) {
  for (const status of ["ASSIGNED", "COMPLETED", "CANCELLED"])
    results.set(status, result(homeworks.filter((item) => item.status === status)));
}

describe("StudentHomeworksView", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    setItems(items);
    mocks.useInfiniteQuery.mockImplementation((options: { queryKey: unknown[] }) => {
      const params = options.queryKey.at(-1) as { status: string };
      return results.get(params.status);
    });
    mocks.useQueries.mockReturnValue([]);
    mocks.useQuery.mockReturnValue({ data: [{ id: "program-1", title: "Реальная программа" }], isError: false });
  });
  afterEach(() => vi.useRealTimers());

  it("shows active assignments in a quiet list with real program names and deadlines", () => {
    render(<StudentHomeworksView />);
    expect(screen.getByRole("heading", { level: 1, name: "Задания" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "В работе" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getAllByText(/Реальная программа/)).toHaveLength(2);
    expect(screen.getByText(/Срок был/)).toHaveTextContent(/24 сентября.*Просрочено/);
    expect(screen.getByRole("link", { name: "Продолжить: Просроченная работа" })).toHaveAttribute(
      "href",
      "/student/homework/overdue",
    );
    expect(screen.queryByText("Готовая работа")).not.toBeInTheDocument();
  });
  it("shows completed and cancelled work only in the completed tab", () => {
    render(<StudentHomeworksView />);
    fireEvent.click(screen.getByRole("tab", { name: "Завершённые" }));
    expect(screen.getByText("Готовая работа")).toBeVisible();
    expect(screen.getByText("Отменённая работа")).toBeVisible();
    expect(screen.getByText("Отменено")).toBeVisible();
    expect(screen.getByText("Выполнено")).toBeVisible();
    expect(screen.queryByText("Будущая работа")).not.toBeInTheDocument();
  });
  it("derives the review tab from submissions and leaves unfinished or failed work active", () => {
    mocks.useQueries.mockReturnValue([
      {
        data: {
          id: "assigned",
          items: [
            { required: true, latestSubmissionStatus: "NEEDS_REVIEW", passed: false },
            { required: true, passed: true },
          ],
        },
      },
      { data: { id: "overdue", items: [{ required: true, latestSubmissionStatus: "FAILED", passed: false }] } },
    ]);
    render(<StudentHomeworksView />);
    expect(screen.queryByText("Будущая работа")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "На проверке" }));
    expect(screen.getByRole("article")).toHaveAccessibleName("Будущая работа");
    expect(screen.queryByText("Просроченная работа")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть: Будущая работа" })).toHaveAttribute(
      "href",
      "/student/homework/assigned",
    );
  });
  it("supports arrow key tab navigation and keeps the panel associated with its tab", () => {
    render(<StudentHomeworksView />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "В работе" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "На проверке" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("На проверке");
    expect(screen.getByText("Нет заданий на проверке")).toBeVisible();
  });
  it("keeps undated work after dated assignments", () => {
    setItems([{ ...base, id: "undated", title: "Без даты", dueAt: null }, base]);
    render(<StudentHomeworksView />);
    expect(screen.getAllByRole("article").map((item) => item.getAttribute("aria-label"))).toEqual([
      "Будущая работа",
      "Без даты",
    ]);
  });
  it("loads more assignments in both active and review tabs even when no matching rows are loaded", () => {
    results.get("ASSIGNED")!.hasNextPage = true;
    render(<StudentHomeworksView />);
    fireEvent.click(screen.getByRole("tab", { name: "На проверке" }));
    fireEvent.click(screen.getByRole("button", { name: "Загрузить ещё задания" }));
    expect(results.get("ASSIGNED")!.fetchNextPage).toHaveBeenCalledOnce();
  });
  it("loads both history streams without dropping previously loaded work", () => {
    results.get("COMPLETED")!.hasNextPage = true;
    results.get("CANCELLED")!.hasNextPage = true;
    render(<StudentHomeworksView />);
    fireEvent.click(screen.getByRole("tab", { name: "Завершённые" }));
    fireEvent.click(screen.getByRole("button", { name: "Загрузить ещё задания" }));
    expect(results.get("COMPLETED")!.fetchNextPage).toHaveBeenCalledOnce();
    expect(results.get("CANCELLED")!.fetchNextPage).toHaveBeenCalledOnce();
    expect(screen.getByText("Готовая работа")).toBeVisible();
  });
  it("keeps partial data and retries only the failed selected query", () => {
    results.get("ASSIGNED")!.isError = true;
    render(<StudentHomeworksView />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(results.get("ASSIGNED")!.refetch).toHaveBeenCalledOnce();
    expect(results.get("CANCELLED")!.refetch).not.toHaveBeenCalled();
    expect(screen.getByText("Просроченная работа")).toBeVisible();
  });
  it("shows a loading announcement instead of an empty state", () => {
    setItems([]);
    results.get("ASSIGNED")!.isPending = true;
    render(<StudentHomeworksView />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Заданий в работе пока нет")).not.toBeInTheDocument();
  });
  it("falls back to real item counts when programs fail", () => {
    mocks.useQuery.mockReturnValue({ isError: true });
    render(<StudentHomeworksView />);
    expect(screen.getAllByText(/4 задания/)).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

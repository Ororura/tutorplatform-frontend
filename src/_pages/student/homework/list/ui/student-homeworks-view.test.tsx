import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StudentHomeworkSummary } from "@/entities/homework";

import { StudentHomeworksView } from "./student-homeworks-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), useInfiniteQuery: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
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
    mocks.useQuery.mockReturnValue({ data: [{ id: "program-1", title: "Реальная программа" }], isError: false });
  });
  afterEach(() => vi.useRealTimers());

  it("renders the page heading and action-first section order without workload statistics", () => {
    render(<StudentHomeworksView />);
    expect(screen.getByRole("heading", { level: 1, name: "Домашние задания" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Требуют внимания · 1",
      "Предстоящие · 1",
      "История · 2",
    ]);
    expect(screen.queryByText("Ваша нагрузка")).not.toBeInTheDocument();
    expect(screen.queryByText(/Назначено/)).not.toBeInTheDocument();
  });
  it("derives overdue from the deadline even when the API overdue flag is false", () => {
    render(<StudentHomeworksView />);
    const attention = screen.getByRole("region", { name: "Требуют внимания · 1" });
    expect(within(attention).getByRole("heading", { name: "Просроченная работа" })).toBeInTheDocument();
    expect(within(attention).getByText("Просрочено")).toBeInTheDocument();
    expect(within(attention).getByText(/24 сентября, \d{2}:00/).parentElement).toHaveTextContent(
      /Срок был 24 сентября/,
    );
    expect(within(attention).getByRole("link", { name: "Открыть: Просроченная работа" })).toHaveAttribute(
      "href",
      "/student/homework/overdue",
    );
  });
  it("places future assignments in upcoming with real program metadata and a detail CTA", () => {
    render(<StudentHomeworksView />);
    const upcoming = screen.getByRole("region", { name: "Предстоящие · 1" });
    expect(within(upcoming).getByRole("article")).toHaveTextContent("Реальная программа · 4 задания");
    expect(within(upcoming).getByText(/3 октября, \d{2}:00/).parentElement).toHaveTextContent(/До 3 октября/);
    expect(within(upcoming).getByRole("link", { name: "Открыть: Будущая работа" })).toHaveAttribute(
      "href",
      "/student/homework/assigned",
    );
    expect(within(upcoming).queryByText("Просрочено")).not.toBeInTheDocument();
  });
  it("places completed and cancelled assignments in history with text statuses and detail routes", () => {
    render(<StudentHomeworksView />);
    const history = screen.getByRole("region", { name: "История · 2" });
    expect(within(history).getByRole("link", { name: /Готовая работа/ })).toHaveAttribute(
      "href",
      "/student/homework/completed",
    );
    expect(within(history).getByRole("link", { name: /Отменённая работа/ })).toHaveAttribute(
      "href",
      "/student/homework/cancelled",
    );
    expect(within(history).getByText("Выполнено")).toBeInTheDocument();
    expect(within(history).getByText("Отменено")).toBeInTheDocument();
    expect(within(history).queryByText("Открыть")).not.toBeInTheDocument();
  });
  it.each([
    ["Требуют внимания", items.filter((item) => item.id !== "overdue")],
    ["Предстоящие", items.filter((item) => item.id !== "assigned")],
    ["История", items.filter((item) => item.status === "ASSIGNED")],
  ])("omits an empty %s section", (title, remaining) => {
    setItems(remaining);
    render(<StudentHomeworksView />);
    expect(screen.queryByRole("region", { name: new RegExp(title) })).not.toBeInTheDocument();
  });
  it("renders one calm empty state only when every homework query succeeded and returned no items", () => {
    setItems([]);
    render(<StudentHomeworksView />);
    expect(screen.getByRole("heading", { name: "Домашних заданий пока нет" })).toBeInTheDocument();
    expect(screen.getByText("Когда преподаватель назначит новое задание, оно появится здесь.")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it.each([null, undefined])("places an assignment with dueAt=%s after dated upcoming work", (dueAt) => {
    setItems([{ ...base, id: "undated", title: "Без даты", dueAt, overdue: true }, base]);
    render(<StudentHomeworksView />);
    const upcoming = screen.getByRole("region", { name: "Предстоящие · 2" });
    expect(
      within(upcoming)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Будущая работа", "Без даты"]);
    expect(within(upcoming).getByText("Без срока")).toBeInTheDocument();
    expect(screen.queryByText("Просрочено")).not.toBeInTheDocument();
  });
  it("falls back to item counts when optional programs cannot be loaded", () => {
    mocks.useQuery.mockReturnValue({ data: undefined, isError: true });
    render(<StudentHomeworksView />);
    expect(screen.getAllByText("4 задания")).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("previews only three history rows, expands and collapses with truthful visible counts", () => {
    setItems(
      Array.from({ length: 6 }, (_, i) => ({
        ...base,
        id: String(i),
        title: `История ${i}`,
        status: "COMPLETED",
        assignedAt: `2026-09-${20 + i}T10:00:00Z`,
      })),
    );
    render(<StudentHomeworksView />);
    expect(screen.getByRole("region", { name: "История · 3" }).querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /История 5/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /История 0/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Показать все" }));
    expect(screen.getByRole("region", { name: "История · 6" }).querySelectorAll("li")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Свернуть" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Свернуть" }));
    expect(screen.getByRole("region", { name: "История · 3" })).toBeInTheDocument();
  });
  it("loads further active and historical server pages without replacing current rows", () => {
    results.get("ASSIGNED")!.hasNextPage = true;
    results.get("COMPLETED")!.hasNextPage = true;
    results.get("CANCELLED")!.hasNextPage = true;
    render(<StudentHomeworksView />);
    fireEvent.click(screen.getByRole("button", { name: "Загрузить ещё задания" }));
    expect(results.get("ASSIGNED")!.fetchNextPage).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Показать все" }));
    fireEvent.click(screen.getByRole("button", { name: "Загрузить ещё" }));
    expect(results.get("COMPLETED")!.fetchNextPage).toHaveBeenCalledOnce();
    expect(results.get("CANCELLED")!.fetchNextPage).toHaveBeenCalledOnce();
    expect(screen.getByText("Готовая работа")).toBeInTheDocument();
  });
  it("retains loaded assignments and retries only failed homework queries", () => {
    const cancelled = results.get("CANCELLED")!;
    cancelled.isError = true;
    render(<StudentHomeworksView />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(cancelled.refetch).toHaveBeenCalledOnce();
    expect(results.get("ASSIGNED")!.refetch).not.toHaveBeenCalled();
    expect(screen.getByText("Просроченная работа")).toBeInTheDocument();
    expect(screen.queryByText("Домашних заданий пока нет")).not.toBeInTheDocument();
  });
  it("shows an accessible skeleton while loading and does not announce an empty list", () => {
    setItems([]);
    results.get("ASSIGNED")!.isPending = true;
    render(<StudentHomeworksView />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Загружаем домашние задания…")).toBeInTheDocument();
    expect(screen.queryByText("Домашних заданий пока нет")).not.toBeInTheDocument();
  });
  it("uses links for navigation with no nested interactive controls", () => {
    const { container } = render(<StudentHomeworksView />);
    expect(container.querySelector("a button, a a, button a")).toBeNull();
    expect(screen.getByRole("link", { name: "Открыть: Просроченная работа" })).toHaveTextContent("Открыть");
  });
});

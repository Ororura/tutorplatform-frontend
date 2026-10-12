import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTeacherAttention } from "@/entities/dashboard";
import { TeacherWorkQueue } from "./teacher-work-queue";

vi.mock("@/entities/dashboard", async (original) => {
  const actual = await original<typeof import("@/entities/dashboard")>();
  return {
    ...actual,
    getTeacherAttention: vi.fn(),
    dashboardQueries: {
      ...actual.dashboardQueries,
      attention: (params: object) => ({
        queryKey: ["dashboard", "attention", params],
        queryFn: () => getTeacherAttention(params),
      }),
    },
  };
});

describe("TeacherWorkQueue", () => {
  beforeEach(() => vi.mocked(getTeacherAttention).mockReset());
  it("loads server pages and resets pagination when changing category", async () => {
    vi.mocked(getTeacherAttention).mockResolvedValue({
      items: [],
      page: 0,
      size: 20,
      totalPages: 3,
      totalElements: 42,
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TeacherWorkQueue />
      </QueryClientProvider>,
    );
    await screen.findByText("Страница 1 из 3 · Всего 42");
    fireEvent.click(screen.getByRole("button", { name: "Вперёд" }));
    await screen.findByText("Страница 2 из 3 · Всего 42");
    fireEvent.click(screen.getByRole("button", { name: "На проверку" }));
    await screen.findByText("Страница 1 из 3 · Всего 42");
    expect(getTeacherAttention).toHaveBeenLastCalledWith({ type: "SUBMISSION_NEEDS_REVIEW", page: 0, size: 20 });
    expect(screen.getByRole("button", { name: "Назад" })).toBeDisabled();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgressShareManagement } from "./progress-share-management";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), refetch: vi.fn() }));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: mocks.useQuery,
}));
vi.mock("@/features/progress-share/create", () => ({
  CreateProgressShareForm: ({ studentProgramId }: { studentProgramId: string }) => (
    <div>Создание {studentProgramId}</div>
  ),
}));
vi.mock("@/features/progress-share/revoke", () => ({
  RevokeProgressShareButton: ({ shareId }: { shareId: string }) => <button type="button">Отозвать {shareId}</button>,
}));

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    isPending: false,
    isError: false,
    refetch: mocks.refetch,
    ...overrides,
  };
}

describe("ProgressShareManagement", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.refetch.mockReset();
  });

  it("handles an empty share list for the selected program", () => {
    mocks.useQuery.mockReturnValue(queryResult());

    render(<ProgressShareManagement studentId="student-1" studentProgramId="program-1" />);

    expect(screen.getByText("Создание program-1")).toBeInTheDocument();
    expect(screen.getByText("Публичных ссылок для этой программы пока нет.")).toBeInTheDocument();
    expect(mocks.useQuery.mock.calls[0][0].queryKey).toEqual([
      "progress-shares",
      "student",
      "student-1",
      "program",
      "program-1",
    ]);
  });

  it("shows API errors and retries the list request", () => {
    mocks.useQuery.mockReturnValue(queryResult({ data: undefined, isError: true }));

    render(<ProgressShareManagement studentId="student-1" studentProgramId="program-1" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить публичные ссылки.");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("offers revocation only for ACTIVE shares", () => {
    mocks.useQuery.mockReturnValue(
      queryResult({
        data: [
          {
            id: "active",
            studentProgramId: "program-1",
            status: "ACTIVE",
            createdAt: "2026-09-20T10:00:00Z",
          },
          {
            id: "expired",
            studentProgramId: "program-1",
            status: "EXPIRED",
            createdAt: "2026-09-19T10:00:00Z",
          },
          {
            id: "revoked",
            studentProgramId: "program-1",
            status: "REVOKED",
            createdAt: "2026-09-18T10:00:00Z",
          },
        ],
      }),
    );

    render(<ProgressShareManagement studentId="student-1" studentProgramId="program-1" />);

    expect(screen.getByRole("button", { name: "Отозвать active" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отозвать expired" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отозвать revoked" })).not.toBeInTheDocument();
  });
});

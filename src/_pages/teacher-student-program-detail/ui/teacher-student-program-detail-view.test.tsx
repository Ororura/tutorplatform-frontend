import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (options: unknown) => options }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

import { ApiClientError } from "@/shared/api/client";

import { TeacherStudentProgramDetailView } from "./teacher-student-program-detail-view";

describe("TeacherStudentProgramDetailView", () => {
  it("shows a safe 404 state", () => {
    const body = { code: "NOT_FOUND", message: "not found", timestamp: "2026-09-01T00:00:00Z", traceId: "trace", details: [] };
    mocks.useQuery.mockReturnValue({ isPending: false, isError: true, error: new ApiClientError(404, body), data: undefined, refetch: vi.fn() });
    render(<TeacherStudentProgramDetailView studentId="student-1" studentProgramId="program-missing" />);
    expect(screen.getByRole("heading", { name: "Программа не найдена" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
  });
});

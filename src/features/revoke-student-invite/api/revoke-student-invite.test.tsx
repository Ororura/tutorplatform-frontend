import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRevokeStudentInviteMutation } from "./revoke-student-invite";

const mocks = vi.hoisted(() => ({ delete: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { DELETE: mocks.delete },
}));

describe("useRevokeStudentInviteMutation", () => {
  beforeEach(() => mocks.delete.mockReset());

  it("revokes through the generated endpoint and invalidates invite and student queries", async () => {
    mocks.delete.mockResolvedValue({ response: { status: 204 } });
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useRevokeStudentInviteMutation("student-1"), { wrapper });

    act(() => result.current.mutate("invite-1"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.delete).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/invites/{inviteId}", {
      params: { path: { studentId: "student-1", inviteId: "invite-1" } },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["student-invites", "list", "student-1"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["students", "detail", "student-1"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["students", "list"] });
  });
});

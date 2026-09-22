import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RevokeProgressShareButton } from "./revoke-progress-share-button";

const mocks = vi.hoisted(() => ({ delete: vi.fn(), confirm: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { DELETE: mocks.delete },
}));

function renderButton() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return {
    invalidate,
    ...render(<RevokeProgressShareButton studentId="student-1" studentProgramId="program-1" shareId="share-1" />, {
      wrapper,
    }),
  };
}

describe("RevokeProgressShareButton", () => {
  beforeEach(() => {
    mocks.delete.mockReset();
    mocks.confirm.mockReset();
    vi.stubGlobal("confirm", mocks.confirm);
  });

  it("does not revoke without confirmation", () => {
    mocks.confirm.mockReturnValue(false);
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Отозвать" }));

    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("revokes a confirmed share and refreshes its program list", async () => {
    mocks.confirm.mockReturnValue(true);
    mocks.delete.mockResolvedValue({ response: { status: 204 } });
    const { invalidate } = renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Отозвать" }));

    await waitFor(() => expect(mocks.delete).toHaveBeenCalledOnce());
    expect(mocks.delete).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/progress/shares/{shareId}", {
      params: { path: { studentId: "student-1", shareId: "share-1" } },
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["progress-shares", "student", "student-1", "program", "program-1"],
      }),
    );
  });
});

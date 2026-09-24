import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RevokeReportShareButton } from "./revoke-report-share-button";

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
    ...render(<RevokeReportShareButton reportId="report-1" shareId="share-1" />, { wrapper }),
  };
}

describe("RevokeReportShareButton", () => {
  beforeEach(() => {
    mocks.delete.mockReset();
    mocks.confirm.mockReset();
    vi.stubGlobal("confirm", mocks.confirm);
  });

  it("revokes a confirmed share and refreshes the history", async () => {
    mocks.confirm.mockReturnValue(true);
    mocks.delete.mockResolvedValue({ response: { status: 204 } });
    const { invalidate } = renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Отозвать доступ" }));
    await waitFor(() =>
      expect(mocks.delete).toHaveBeenCalledWith("/api/v1/teacher/reports/{reportId}/shares/{shareId}", {
        params: { path: { reportId: "report-1", shareId: "share-1" } },
      }),
    );
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["report-shares", "report-1"] }));
  });
});

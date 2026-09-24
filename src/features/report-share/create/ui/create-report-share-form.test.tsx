import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateReportShareForm } from "./create-report-share-form";

const mocks = vi.hoisted(() => ({ post: vi.fn(), writeText: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { POST: mocks.post },
}));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { invalidate, ...render(<CreateReportShareForm reportId="report-1" />, { wrapper }) };
}

describe("CreateReportShareForm", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: mocks.writeText },
    });
  });

  it("creates a share through the report endpoint and copies its one-time URL", async () => {
    const created = {
      id: "share-1",
      reportId: "report-1",
      shareUrl: "https://example.test/reports/secret-token",
      createdAt: "2026-09-24T10:00:00Z",
    };
    mocks.post.mockResolvedValue({ data: created, response: { status: 201 } });
    const { invalidate } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Создать публичную ссылку" }));
    await screen.findByText("Публичная ссылка создана");
    expect(mocks.post).toHaveBeenCalledWith("/api/v1/teacher/reports/{reportId}/shares", {
      params: { path: { reportId: "report-1" } },
      body: {},
    });
    expect(screen.getByLabelText("Публичная ссылка на отчёт")).toHaveValue(created.shareUrl);

    fireEvent.click(screen.getByRole("button", { name: "Копировать" }));
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith(created.shareUrl));
    expect(await screen.findByRole("button", { name: "Скопировано" })).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["report-shares", "report-1"] });
  });

  it("explains that a draft cannot be shared when backend returns 409", async () => {
    mocks.post.mockResolvedValue({
      error: {
        code: "REPORT_SHARE_NOT_ALLOWED",
        message: "internal",
        timestamp: "2026-09-24T10:00:00Z",
        traceId: "trace",
        details: [],
      },
      response: { status: 409 },
    });
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Создать публичную ссылку" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("только для опубликованного отчёта");
  });
});

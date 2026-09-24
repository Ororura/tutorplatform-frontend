import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReportPublicationManagement } from "./report-publication-management";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("@/features/report/download", () => ({
  ReportPdfDownloadButton: () => <button type="button">Скачать PDF</button>,
}));
vi.mock("@/features/report-share/create", () => ({
  CreateReportShareForm: () => <button type="button">Создать публичную ссылку</button>,
}));
vi.mock("@/features/report-share/revoke", () => ({
  RevokeReportShareButton: () => <button type="button">Отозвать доступ</button>,
}));

describe("ReportPublicationManagement", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset().mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("does not offer PDF or share creation for a draft", () => {
    render(<ReportPublicationManagement reportId="report-1" status="DRAFT" />);
    expect(screen.getByText(/Backend не создаёт публичные ссылки для черновиков/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Создать публичную ссылку" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Скачать PDF" })).not.toBeInTheDocument();
  });

  it("shows download, share creation, history and revoke for a published report", () => {
    mocks.useQuery.mockReturnValue({
      data: [
        {
          id: "share-1",
          reportId: "report-1",
          status: "ACTIVE",
          createdAt: "2026-09-24T10:00:00Z",
        },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<ReportPublicationManagement reportId="report-1" status="PUBLISHED" />);
    expect(screen.getByRole("button", { name: "Скачать PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Создать публичную ссылку" })).toBeInTheDocument();
    expect(screen.getByText("Активна")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отозвать доступ" })).toBeInTheDocument();
    expect(screen.queryByText("share-1")).not.toBeInTheDocument();
    expect(screen.queryByText("report-1")).not.toBeInTheDocument();
  });
});

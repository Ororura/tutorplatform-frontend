import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProgressShare } from "../api/progress-share-queries";
import { ProgressShareList } from "./progress-share-list";

const shares: ProgressShare[] = [
  {
    id: "share-active",
    studentProgramId: "program-1",
    status: "ACTIVE",
    createdAt: "2026-09-20T10:00:00Z",
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: "share-expired",
    studentProgramId: "program-1",
    status: "EXPIRED",
    createdAt: "2026-09-18T10:00:00Z",
    expiresAt: "2026-09-19T10:00:00Z",
    revokedAt: null,
  },
  {
    id: "share-revoked",
    studentProgramId: "program-1",
    status: "REVOKED",
    createdAt: "2026-09-16T10:00:00Z",
    expiresAt: null,
    revokedAt: "2026-09-17T10:00:00Z",
  },
];

describe("ProgressShareList", () => {
  it("shows the empty state", () => {
    render(<ProgressShareList shares={[]} />);

    expect(screen.getByText("Публичных ссылок для этой программы пока нет.")).toBeInTheDocument();
  });

  it("shows every API status and delegates row actions", () => {
    const renderActions = vi.fn((share: ProgressShare) => <button type="button">Действие {share.id}</button>);

    render(<ProgressShareList shares={shares} renderActions={renderActions} />);

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("EXPIRED")).toBeInTheDocument();
    expect(screen.getByText("REVOKED")).toBeInTheDocument();
    expect(screen.getAllByText("Без даты истечения")).toHaveLength(2);
    expect(screen.getByText(/Отозвано/)).toBeInTheDocument();
    expect(renderActions).toHaveBeenCalledTimes(3);
  });
});

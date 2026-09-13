import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentInviteHistory } from "./student-invite-history";

describe("StudentInviteHistory", () => {
  it("renders empty history", () => {
    render(<StudentInviteHistory invites={[]} onRevoke={vi.fn()} />);
    expect(screen.getByText("Приглашений ещё нет.")).toBeInTheDocument();
  });

  it("allows revoking only an active invite", () => {
    const onRevoke = vi.fn();
    render(
      <StudentInviteHistory
        onRevoke={onRevoke}
        invites={[
          { id: "active", email: "active@example.com", status: "ACTIVE", expiresAt: "2026-09-10T08:00:00Z", createdAt: "2026-09-07T08:00:00Z" },
          { id: "accepted", email: "accepted@example.com", status: "ACCEPTED", expiresAt: "2026-09-10T08:00:00Z", createdAt: "2026-09-06T08:00:00Z" },
        ]}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Отозвать" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Отозвать" }));
    expect(onRevoke).toHaveBeenCalledWith("active");
  });
});

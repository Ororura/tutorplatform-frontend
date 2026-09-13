import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentDetailsCard } from "./student-details-card";

describe("StudentDetailsCard", () => {
  it("renders real details fields and keeps student/account statuses separate", () => {
    render(<StudentDetailsCard student={{
      id: "student-1",
      firstName: "Мария",
      lastName: "Петрова",
      status: "INACTIVE",
      account: { status: "REGISTERED", email: "maria@example.com" },
      relation: { type: "PRIMARY", startedAt: "2026-09-01T10:00:00Z" },
      createdAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-02T10:00:00Z",
    }} />);

    expect(screen.getByText("Мария")).toBeInTheDocument();
    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    expect(screen.getByText("Неактивен")).toBeInTheDocument();
    expect(screen.getByText("Зарегистрирован")).toBeInTheDocument();
  });
});

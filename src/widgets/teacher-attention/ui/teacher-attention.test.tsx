import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TeacherAttention } from "./teacher-attention";

describe("TeacherAttention", () => {
  it("explains that the aggregate is unavailable without claiming an all-clear", () => {
    render(<TeacherAttention />);

    expect(screen.getByRole("heading", { name: "Требует внимания" })).toBeInTheDocument();
    expect(screen.getByText(/сводка по работам пока недоступна/i)).toBeInTheDocument();
    expect(screen.queryByText("Все работы проверены. Пока ничего не требует вашего внимания")).not.toBeInTheDocument();
  });
});

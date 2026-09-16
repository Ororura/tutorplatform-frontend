import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateStudentDialog } from "./create-student-dialog";

vi.mock("./create-student-form", () => ({ CreateStudentForm: () => <form>Форма ученика</form> }));

describe("CreateStudentDialog", () => {
  it("opens the form from the primary action", () => {
    render(<CreateStudentDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить ученика" }));
    expect(screen.getByRole("dialog", { name: "Добавить ученика" })).toBeInTheDocument();
    expect(screen.getByText("Форма ученика")).toBeInTheDocument();
  });
});

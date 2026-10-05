import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonClassName } from "./button";

describe("Button", () => {
  it("blocks repeated actions while loading and announces busy state", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Сохранить
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Сохранить" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
  it("preserves explicit disabled state and native props", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} type="submit" disabled aria-label="Отправить работу">
        Отправить
      </Button>,
    );
    expect(ref.current).toBe(screen.getByRole("button", { name: "Отправить работу" }));
    expect(ref.current).toBeDisabled();
    expect(ref.current).toHaveAttribute("type", "submit");
  });
  it("allows contextual layout overrides for buttons and action links", () => {
    const classes = buttonClassName("secondary", "w-full");
    render(
      <Button variant="secondary" className="w-full">
        Отмена
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Отмена" }).className).toBe(classes);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActionMenu } from ".";

function setup() {
  const select = vi.fn();
  render(
    <>
      <ActionMenu
        label="Действия темы"
        items={[
          { label: "Переместить вверх", disabled: true, onSelect: select },
          { label: "Переместить вниз", onSelect: select },
          { label: "Редактировать", onSelect: select },
          { label: "Удалить", onSelect: select, destructive: true, separator: true },
        ]}
      />
      <button>Следующее действие</button>
    </>,
  );
  return { select, trigger: screen.getByRole("button", { name: "Действия темы" }) };
}

describe("ActionMenu", () => {
  it("opens with arrows and navigates enabled actions with wrapping, Home and End", () => {
    const { trigger } = setup();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = screen.getByRole("menu", { name: "Действия темы" });
    expect(trigger).toHaveAttribute("aria-controls", menu.id);
    expect(screen.getByRole("menuitem", { name: "Переместить вниз" })).toHaveFocus();
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveFocus();
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "Переместить вниз" })).toHaveFocus();
    fireEvent.keyDown(menu, { key: "End" });
    expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveFocus();
    fireEvent.keyDown(menu, { key: "Home" });
    expect(screen.getByRole("menuitem", { name: "Переместить вниз" })).toHaveFocus();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveFocus();
  });

  it("runs only enabled actions and restores trigger focus before opening a dialog", () => {
    const { trigger, select } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Переместить вверх" }));
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("menuitem", { name: "Редактировать" }));
    expect(select).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("dismisses on outside interaction or Tab without trapping the keyboard", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Следующее действие" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    fireEvent(screen.getByRole("menu"), event);
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

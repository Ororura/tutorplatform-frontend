import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("opens with arrows and navigates enabled actions with wrapping, Home and End", async () => {
    const { trigger } = setup();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = await screen.findByRole("menu", { name: "Действия темы" });
    expect(trigger).toHaveAttribute("aria-controls", menu.id);
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Переместить вниз" })).toHaveFocus());
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveFocus());
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Переместить вниз" })).toHaveFocus());
    fireEvent.keyDown(menu, { key: "End" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveFocus());
    fireEvent.keyDown(menu, { key: "Home" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Переместить вниз" })).toHaveFocus());
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.keyDown(trigger, { key: "Enter" });
    const reopened = await screen.findByRole("menu");
    fireEvent.keyDown(reopened, { key: "End" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveFocus());
  });

  it("runs only enabled actions and restores trigger focus before opening a dialog", async () => {
    const { trigger, select } = setup();
    fireEvent.keyDown(trigger, { key: "Enter" });
    await screen.findByRole("menu");
    fireEvent.click(screen.getByRole("menuitem", { name: "Переместить вверх" }));
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("menuitem", { name: "Редактировать" }));
    expect(select).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("dismisses on outside interaction or Tab without trapping the keyboard", async () => {
    const { trigger } = setup();
    fireEvent.keyDown(trigger, { key: "Enter" });
    await screen.findByRole("menu");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Следующее действие" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "Enter" });
    await screen.findByRole("menu");
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    fireEvent(screen.getByRole("menu"), event);
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

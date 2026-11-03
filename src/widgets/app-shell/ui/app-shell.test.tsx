import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

const state = vi.hoisted(() => ({ roles: ["TEACHER"] as string[], path: "/teacher/students/id" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("@/entities/user/api/current-user", () => ({
  useCurrentUserQuery: () => ({
    data: { displayName: "Анна Ковалева", email: "teacher@example.com", roles: state.roles },
  }),
}));
vi.mock("@/features/auth/logout", () => ({ LogoutButton: () => <button>Выйти</button> }));
afterEach(() => {
  state.roles = ["TEACHER"];
  state.path = "/teacher/students/id";
});

describe("AppShell", () => {
  it("keeps nested teacher routes active and gates the admin switch by role", () => {
    const { rerender } = render(
      <AppShell role="teacher">
        <main>Страница</main>
      </AppShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Навигация преподавателя" });
    expect(within(nav).getByRole("link", { name: "Ученики" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Главная" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("link", { name: "Администрирование" })).not.toBeInTheDocument();
    state.roles = ["TEACHER", "ADMIN"];
    rerender(
      <AppShell role="teacher">
        <main>Страница</main>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Администрирование" })).toHaveAttribute("href", "/admin");
  });
  it("preserves the student navigation, profile and logout", () => {
    state.path = "/student/homework/id";
    state.roles = ["STUDENT"];
    render(
      <AppShell role="student">
        <main>Задание</main>
      </AppShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Навигация ученика" });
    expect(within(nav).getByRole("link", { name: "Домашние задания" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("teacher@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выйти" })).toBeInTheDocument();
  });
  it("renders admin routes and only offers teaching to users with that role", () => {
    state.path = "/admin/settings";
    state.roles = ["ADMIN"];
    const { rerender } = render(<AppShell role="admin">Настройки</AppShell>);
    expect(screen.getByRole("link", { name: "Настройки" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Кабинет преподавателя" })).not.toBeInTheDocument();
    state.roles.push("TEACHER");
    rerender(<AppShell role="admin">Настройки</AppShell>);
    expect(screen.getByRole("link", { name: "Кабинет преподавателя" })).toHaveAttribute("href", "/teacher");
  });
  it("opens mobile navigation with an accessible title, closes on Escape and restores focus", async () => {
    render(<AppShell role="teacher">Страница</AppShell>);
    const trigger = screen.getByRole("button", { name: "Открыть меню" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Умнее Вместе" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Мобильная навигация преподавателя" })).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { LoginForm } from "./login-form";

const { mutateAsync, replace } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./registration-availability", () => ({
  RegistrationAvailability: () => null,
}));

vi.mock("../api/login", () => ({
  useLoginMutation: () => ({ mutateAsync, isPending: false }),
}));

afterEach(() => {
  cleanup();
  mutateAsync.mockReset();
  replace.mockReset();
});

describe("LoginForm", () => {
  it("shows invalid credentials from a login 401 without a global redirect", async () => {
    mutateAsync.mockRejectedValue(
      new ApiClientError(401, {
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Invalid credentials",
        timestamp: new Date().toISOString(),
        traceId: "trace-id",
        details: [],
      }),
    );
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "teacher.demo@tutor.local" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "wrong-password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Неверный email или пароль");
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects a successful student login to the student area", async () => {
    mutateAsync.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      email: "alex.demo@tutor.local",
      displayName: "Alex",
      roles: ["STUDENT"],
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alex.demo@tutor.local" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "DemoStudent123!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/student"));
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    useQuery: useQueryMock,
  };
});

import { RegistrationAvailability } from "./registration-availability";

afterEach(() => {
  cleanup();
  useQueryMock.mockReset();
});

describe("RegistrationAvailability", () => {
  it("shows the registration link in OPEN mode", () => {
    useQueryMock.mockReturnValue({
      isPending: false,
      isFetching: false,
      isError: false,
      data: {
        registrationMode: "OPEN",
      },
    });

    render(<RegistrationAvailability />);

    expect(
      screen.getByRole("link", {
        name: "Зарегистрироваться",
      }),
    ).toHaveAttribute("href", "/register");
  });

  it("hides registration link in INVITE_ONLY mode", () => {
    useQueryMock.mockReturnValue({
      isPending: false,
      isFetching: false,
      isError: false,
      data: {
        registrationMode: "INVITE_ONLY",
      },
    });

    render(<RegistrationAvailability />);

    expect(
      screen.queryByRole("link", {
        name: "Зарегистрироваться",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Регистрация преподавателей доступна по приглашению.")).toBeInTheDocument();
  });

  it("does not show stale registration link during refetch", () => {
    useQueryMock.mockReturnValue({
      isPending: false,
      isFetching: true,
      isError: false,
      data: {
        registrationMode: "OPEN",
      },
    });

    render(<RegistrationAvailability />);

    expect(
      screen.queryByRole("link", {
        name: "Зарегистрироваться",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not block login when settings cannot be loaded", () => {
    useQueryMock.mockReturnValue({
      isPending: false,
      isFetching: false,
      isError: true,
      data: undefined,
    });

    const { container } = render(<RegistrationAvailability />);

    expect(container).toBeEmptyDOMElement();
  });
});

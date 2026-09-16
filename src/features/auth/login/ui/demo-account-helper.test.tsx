import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemoAccountHelper } from "./demo-account-helper";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("DemoAccountHelper", () => {
  it("renders demo account fillers only in enabled non-production mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    const onSelect = vi.fn();

    render(<DemoAccountHelper onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Demo Teacher" }));

    expect(onSelect).toHaveBeenCalledWith({
      email: "teacher.demo@tutor.local",
      password: "DemoTeacher123!",
    });
  });

  it.each([
    ["development", "false"],
    ["production", "true"],
  ])("does not render when NODE_ENV=%s and flag=%s", (nodeEnv, enabled) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", enabled);

    const { container } = render(<DemoAccountHelper onSelect={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});

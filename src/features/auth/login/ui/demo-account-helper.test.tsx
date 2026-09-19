import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemoAccountHelper } from "./demo-account-helper";
import { DemoModeProvider } from "@/shared/config";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("DemoAccountHelper", () => {
  it("renders demo account fillers only in enabled non-production mode", () => {
    const onSelect = vi.fn();

    render(
      <DemoModeProvider isDemo>
        <DemoAccountHelper onSelect={onSelect} />
      </DemoModeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Demo Teacher" }));

    expect(onSelect).toHaveBeenCalledWith({
      email: "teacher.demo@tutor.local",
      password: "DemoTeacher123!",
    });
  });

  it("does not render when demo mode is disabled", () => {
    const { container } = render(
      <DemoModeProvider isDemo={false}>
        <DemoAccountHelper onSelect={vi.fn()} />
      </DemoModeProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

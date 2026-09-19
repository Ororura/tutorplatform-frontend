import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoModeProvider, useDemoMode } from "./demo-mode";

function DemoStatus() {
  return <span>{useDemoMode() ? "demo" : "production"}</span>;
}

describe("DemoModeProvider", () => {
  it.each([
    [true, "demo"],
    [false, "production"],
  ])("provides the runtime demo value", (isDemo, expected) => {
    render(
      <DemoModeProvider isDemo={isDemo}>
        <DemoStatus />
      </DemoModeProvider>,
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

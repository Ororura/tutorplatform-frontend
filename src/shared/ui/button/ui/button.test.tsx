import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, type ButtonVariant } from "./button";

const expectedVariantClasses: Record<ButtonVariant, { interactive: string[]; disabled: string[] }> = {
  primary: {
    interactive: [
      "bg-blue-600",
      "text-white",
      "hover:bg-blue-700",
      "active:bg-blue-800",
      "focus-visible:ring-blue-600",
    ],
    disabled: ["disabled:bg-blue-100", "disabled:text-blue-800"],
  },
  secondary: {
    interactive: [
      "bg-white",
      "text-slate-700",
      "hover:bg-slate-50",
      "active:bg-slate-100",
      "focus-visible:ring-blue-600",
    ],
    disabled: ["disabled:bg-slate-100", "disabled:text-slate-600"],
  },
  ghost: {
    interactive: [
      "bg-transparent",
      "text-slate-700",
      "hover:bg-slate-100",
      "active:bg-slate-200",
      "focus-visible:ring-blue-600",
    ],
    disabled: ["disabled:text-slate-600"],
  },
  danger: {
    interactive: ["bg-red-600", "text-white", "hover:bg-red-700", "active:bg-red-800", "focus-visible:ring-red-600"],
    disabled: ["disabled:bg-red-100", "disabled:text-red-800"],
  },
};

describe("Button", () => {
  it.each(Object.entries(expectedVariantClasses) as [ButtonVariant, { interactive: string[]; disabled: string[] }][])(
    "provides contrasting interaction colors for the %s variant",
    (variant, expectedClasses) => {
      render(
        <Button variant={variant} disabled>
          {variant}
        </Button>,
      );

      expect(screen.getByRole("button", { name: variant })).toHaveClass(
        ...expectedClasses.interactive,
        ...expectedClasses.disabled,
      );
    },
  );

  it("prevents disabled buttons from receiving pointer interaction", () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole("button", { name: "Disabled" })).toHaveClass(
      "disabled:pointer-events-none",
      "disabled:cursor-not-allowed",
      "disabled:shadow-none",
    );
  });
});

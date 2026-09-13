import { describe, expect, it } from "vitest";

import { loginSchema } from "./login-schema";

describe("loginSchema", () => {
  it("accepts valid credentials and trims email", () => {
    expect(
      loginSchema.parse({ email: " teacher@example.com ", password: "long-password" }),
    ).toEqual({ email: "teacher@example.com", password: "long-password" });
  });

  it("rejects malformed email and short password", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "short" });

    expect(result.success).toBe(false);
  });
});

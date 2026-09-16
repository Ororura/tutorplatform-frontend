import { describe, expect, it } from "vitest";

import { registerTeacherSchema } from "./register-teacher-schema";

describe("registerTeacherSchema", () => {
  it("accepts matching passwords and trims text fields", () => {
    expect(
      registerTeacherSchema.parse({
        displayName: " Преподаватель ",
        email: " teacher@example.com ",
        password: "long-password",
        passwordConfirmation: "long-password",
      }),
    ).toMatchObject({ displayName: "Преподаватель", email: "teacher@example.com" });
  });

  it("rejects mismatched passwords on the confirmation field", () => {
    const result = registerTeacherSchema.safeParse({
      displayName: "Преподаватель",
      email: "teacher@example.com",
      password: "long-password",
      passwordConfirmation: "other-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["passwordConfirmation"]);
    }
  });
});

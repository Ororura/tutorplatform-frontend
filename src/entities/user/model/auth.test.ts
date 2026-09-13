import { describe, expect, it } from "vitest";

import type { CurrentUser } from "../api/current-user";
import { getRoleRedirect, getUserHome } from "./auth";

const teacher: CurrentUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "teacher@tutor.local",
  displayName: "Teacher",
  roles: ["TEACHER"],
};
const student: CurrentUser = { ...teacher, email: "student@tutor.local", roles: ["STUDENT"] };

describe("auth routing", () => {
  it("routes each authenticated role to its own area", () => {
    expect(getUserHome(teacher)).toBe("/teacher");
    expect(getUserHome(student)).toBe("/student");
  });

  it("redirects an anonymous protected route to login", () => {
    expect(getRoleRedirect(null, "TEACHER", "/teacher/students")).toBe(
      "/login?next=%2Fteacher%2Fstudents",
    );
  });

  it("redirects a user away from the other role area", () => {
    expect(getRoleRedirect(student, "TEACHER", "/teacher")).toBe("/student");
    expect(getRoleRedirect(teacher, "STUDENT", "/student")).toBe("/teacher");
  });

  it("allows the matching role", () => {
    expect(getRoleRedirect(teacher, "TEACHER", "/teacher")).toBeNull();
    expect(getRoleRedirect(student, "STUDENT", "/student")).toBeNull();
  });
});

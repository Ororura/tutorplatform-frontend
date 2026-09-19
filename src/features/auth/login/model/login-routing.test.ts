import { describe, expect, it } from "vitest";

import type { CurrentUser } from "@/entities/user";

import { getPostLoginRoute } from "./login-routing";

const teacher: CurrentUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "teacher@tutor.local",
  displayName: "Teacher",
  roles: ["TEACHER"],
};
const student: CurrentUser = { ...teacher, roles: ["STUDENT"] };

describe("getPostLoginRoute", () => {
  it("routes teacher and student logins to role homes", () => {
    expect(getPostLoginRoute(teacher, null)).toBe("/teacher");
    expect(getPostLoginRoute(student, null)).toBe("/student");
  });

  it("routes ADMIN to /admin", () => {
    const admin: CurrentUser = {
      ...teacher,
      roles: ["ADMIN", "TEACHER"],
    };

    expect(getPostLoginRoute(admin, null)).toBe("/admin");

    expect(getPostLoginRoute(admin, "/admin/settings")).toBe("/admin/settings");

    expect(getPostLoginRoute(admin, "/teacher/students")).toBe("/teacher/students");

    expect(getPostLoginRoute(admin, "/student")).toBe("/admin");
  });

  it("keeps only a requested path inside the authenticated role area", () => {
    expect(getPostLoginRoute(teacher, "/teacher/students")).toBe("/teacher/students");
    expect(getPostLoginRoute(student, "/teacher/students")).toBe("/student");
  });
});

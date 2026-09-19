import type { CurrentUser } from "../api/current-user";

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  | { status: "error"; error: Error };

export type UserHome = "/admin" | "/teacher" | "/student";

export function getUserHome(user: CurrentUser): UserHome {
  if (user.roles.includes("ADMIN")) {
    return "/admin";
  }

  if (user.roles.includes("TEACHER")) {
    return "/teacher";
  }

  return "/student";
}

export function getRoleRedirect(
  user: CurrentUser | null,
  role: CurrentUser["roles"][number],
  pathname: string,
): string | null {
  if (user === null) {
    return `/login?next=${encodeURIComponent(pathname)}`;
  }

  return user.roles.includes(role) ? null : getUserHome(user);
}

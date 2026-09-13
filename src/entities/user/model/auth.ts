import type { CurrentUser } from "../api/current-user";

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  | { status: "error"; error: Error };

export function getUserHome(user: CurrentUser): "/teacher" | "/student" {
  return user.roles.includes("TEACHER") ? "/teacher" : "/student";
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

import { type CurrentUser, getUserHome } from "@/entities/user";

export function getPostLoginRoute(user: CurrentUser, requestedPath: string | null): string {
  const home = getUserHome(user);
  const requestedArea = home === "/teacher" ? "/teacher" : "/student";

  if (requestedPath === requestedArea || requestedPath?.startsWith(`${requestedArea}/`)) {
    return requestedPath;
  }

  return home;
}

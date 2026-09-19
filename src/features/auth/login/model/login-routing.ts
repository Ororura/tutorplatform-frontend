import { type CurrentUser, getUserHome } from "@/entities/user";

const ROLE_AREAS = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
} as const;

export function getPostLoginRoute(user: CurrentUser, requestedPath: string | null): string {
  const home = getUserHome(user);

  if (!requestedPath || !requestedPath.startsWith("/") || requestedPath.startsWith("//")) {
    return home;
  }

  const allowedAreas = user.roles
    .map((role) => ROLE_AREAS[role as keyof typeof ROLE_AREAS])
    .filter((area): area is NonNullable<typeof area> => area !== undefined);

  const isAllowed = allowedAreas.some((area) => requestedPath === area || requestedPath.startsWith(`${area}/`));

  return isAllowed ? requestedPath : home;
}

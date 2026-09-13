import { useCurrentUserQuery } from "../api/current-user";
import type { AuthState } from "./auth";

export function useAuth(): AuthState {
  const currentUser = useCurrentUserQuery();

  if (currentUser.isPending) {
    return { status: "loading" };
  }
  if (currentUser.isError) {
    return { status: "error", error: currentUser.error };
  }
  if (currentUser.data === null) {
    return { status: "unauthenticated" };
  }
  return { status: "authenticated", user: currentUser.data };
}

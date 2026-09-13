import createClient from "openapi-fetch";

import type { paths } from "../generated/schema";
import { apiTransport } from "./http-client";

export const apiClient = createClient<paths>({
  credentials: "include",
  fetch: apiTransport,
});

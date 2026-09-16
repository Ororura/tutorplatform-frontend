"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { currentUserQueryKey } from "@/entities/user";
import { getCsrfToken, setUnauthorizedHandler, shouldRetryApiError } from "@/shared/api/client";

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: shouldRetryApiError,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ApiLifecycle queryClient={queryClient}>{children}</ApiLifecycle>
    </QueryClientProvider>
  );
}

function ApiLifecycle({ children, queryClient }: Readonly<{ children: React.ReactNode; queryClient: QueryClient }>) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void getCsrfToken().catch(() => {
      // Unsafe requests will retry CSRF initialization and expose a typed error to their feature.
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(currentUserQueryKey, null);
      if (!isPublicPath(pathname)) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [pathname, queryClient, router]);

  return children;
}

function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register" || pathname.startsWith("/invite/");
}

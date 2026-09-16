"use client";

import { QueryClient, QueryClientConfig, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { currentUserQueryKey } from "@/entities/user";
import { getCsrfToken, setUnauthorizedHandler, shouldRetryApiError } from "@/shared/api/client";

const queryClientConfig: QueryClientConfig = {
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
};

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      <ApiLifecycle queryClient={queryClient}>{children}</ApiLifecycle>
    </QueryClientProvider>
  );
}

function ApiLifecycle({ children, queryClient }: Readonly<{ children: React.ReactNode; queryClient: QueryClient }>) {
  const router = useRouter();

  useEffect(() => {
    void getCsrfToken().catch(() => undefined);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      const pathname = window.location.pathname;

      void queryClient.cancelQueries();

      queryClient.clear();
      queryClient.setQueryData(currentUserQueryKey, null);

      if (!isPublicPath(pathname)) {
        return;
      }

      const next = window.location.pathname + window.location.search + window.location.hash;

      router.replace(`/login?next=${encodeURIComponent(next)}`);
    });

    return () => setUnauthorizedHandler(null);
  }, [queryClient, router]);

  return children;
}

function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register" || pathname.startsWith("/invite/");
}

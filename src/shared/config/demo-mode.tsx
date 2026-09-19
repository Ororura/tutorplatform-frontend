"use client";

import { createContext, useContext } from "react";

const DemoModeContext = createContext(false);

export function DemoModeProvider({
  children,
  isDemo,
}: Readonly<{ children: React.ReactNode; isDemo: boolean }>) {
  return <DemoModeContext.Provider value={isDemo}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}

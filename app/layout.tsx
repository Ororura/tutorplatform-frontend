import type { Metadata } from "next";
import { connection } from "next/server";
import { AppProviders } from "@/_app/providers";
import "@/_app/styles/globals.css";
import { DemoModeProvider } from "@/shared/config";

export const metadata: Metadata = {
  title: "Tutor Learning Platform",
  description: "Digital tutoring workflow and transparent learning progress.",
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const isDemo = process.env.DEMO_MODE === "true";

  return (
    <html lang="ru">
      <body>
        <DemoModeProvider isDemo={isDemo}>
          <AppProviders>{children}</AppProviders>
        </DemoModeProvider>
      </body>
    </html>
  );
}

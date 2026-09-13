import type { Metadata } from "next";
import { AppProviders } from "@/_app/providers";
import "@/_app/styles/globals.css";

export const metadata: Metadata = {
  title: "Tutor Learning Platform",
  description: "Digital tutoring workflow and transparent learning progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

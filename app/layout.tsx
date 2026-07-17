import type { Metadata } from "next";
import { AppShell } from "@/frontend/components/app-shell";
import "@/frontend/styles/globals.css";

export const metadata: Metadata = {
  title: process.env.APP_NAME ?? "SiaBox Mini",
  description: "A beginner-friendly decentralized file storage demo",
};

/**
 * Thin Next.js root layout.
 * UI shell lives in frontend/ — this file only wires Next.js to it.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appName = process.env.APP_NAME ?? "SiaBox Mini";

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppShell appName={appName}>{children}</AppShell>
      </body>
    </html>
  );
}

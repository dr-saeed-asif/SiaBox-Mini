import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.APP_NAME ?? "SiaBox Mini",
  description: "A beginner-friendly decentralized file storage demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appName = process.env.APP_NAME ?? "SiaBox Mini";

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold text-indigo-700">
              {appName}
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/" className="text-slate-600 hover:text-indigo-600">
                Home
              </Link>
              <Link href="/upload" className="text-slate-600 hover:text-indigo-600">
                Upload
              </Link>
              <Link href="/files" className="text-slate-600 hover:text-indigo-600">
                Files
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          SiaBox Mini — Learn decentralized file storage step by step
        </footer>
      </body>
    </html>
  );
}

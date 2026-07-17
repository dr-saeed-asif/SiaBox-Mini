import Link from "next/link";

interface AppShellProps {
  children: React.ReactNode;
  appName: string;
}

/**
 * Shared frontend layout shell: header, nav, and footer.
 * Used by the Next.js root layout in app/layout.tsx.
 */
export function AppShell({ children, appName }: AppShellProps) {
  return (
    <>
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
    </>
  );
}

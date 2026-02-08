import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "AutoTrust",
  description: "Verifiable car reputation powered by proofs + AI explanations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {/* Background glow */}
        <div
          className="pointer-events-none fixed inset-0
                     bg-[radial-gradient(60%_50%_at_50%_0%,
                     rgba(59,130,246,0.12),
                     transparent_70%)]"
        />

        {/* Page container */}
        <div className="relative mx-auto max-w-6xl px-6 py-8">
          <header className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-white"
            >
              Carify
            </Link>

            <nav className="flex items-center gap-4 text-sm text-neutral-300">
              <Link
                href="/submit"
                className="rounded-lg px-3 py-1.5 hover:bg-neutral-800 hover:text-white transition"
              >
              </Link>
            </nav>
          </header>

          <main className="mt-12">{children}</main>

          <footer className="mt-20 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
            Built for hackathon demo • Proofs on-chain • Evidence off-chain • AI explains only
          </footer>
        </div>
      </body>
    </html>
  );
}

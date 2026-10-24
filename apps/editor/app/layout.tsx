import type { Metadata } from "next";
import { Prompt, Sarabun } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-prompt",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "TCOS editor",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fixtures = process.env.USE_FIXTURES === "true";
  return (
    <html lang="th" className={`${prompt.variable} ${sarabun.variable}`}>
      <body className="antialiased">
        <header className="border-b border-border">
          <div className="editor-width flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
            <Link href="/" className="font-heading text-body-lg font-bold text-accent">
              TCOS editor
            </Link>
            <nav aria-label="Editor" className="flex gap-4 text-muted">
              <Link href="/pages/home" className="hover:text-foreground">
                Home page
              </Link>
              <Link href="/" className="hover:text-foreground">
                Projects
              </Link>
            </nav>
            {fixtures ? (
              <span className="ml-auto rounded-[var(--radius-button)] border border-accent px-2 text-accent">
                Fixtures: saves last until restart
              </span>
            ) : null}
          </div>
        </header>
        <main className="editor-width py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Prompt, Sarabun } from "next/font/google";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
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
        <header className="editor-wide sticky top-0 z-20 pt-3">
          <div className="bar flex flex-wrap items-center gap-x-8 gap-y-1 px-4 py-2.5">
            <Link href="/" className="font-heading font-bold">
              TCOS editor
            </Link>
            <NavLinks />
            {fixtures ? (
              <span className="text-muted sm:ml-auto">Sample data: saves last until the editor restarts</span>
            ) : null}
          </div>
        </header>
        <main className="editor-wide py-10">{children}</main>
      </body>
    </html>
  );
}

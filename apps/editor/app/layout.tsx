import type { Metadata } from "next";
import { Prompt, Sarabun } from "next/font/google";
import Image from "next/image";
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
  return (
    <html lang="th" className={`${prompt.variable} ${sarabun.variable}`}>
      <body className="antialiased">
        <header className="editor-wide sticky top-0 z-20 pt-3">
          <div className="bar flex items-center gap-x-4 px-3 py-2 sm:gap-x-6">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Portfolio website editor, all pages and projects">
              <Image src="/logo.png" alt="The Coming of Stages" width={412} height={359} priority className="h-8 w-auto" />
              <span className="hidden whitespace-nowrap font-body sm:inline">Portfolio website editor</span>
            </Link>
            {/* The page being edited, and its Save and Discard, come from the page (HeaderSlot). */}
            <div id="header-title" className="flex min-w-0 flex-1 items-center" />
            <div id="header-actions" className="flex shrink-0 items-center" />
          </div>
        </header>
        <main className="editor-wide py-8">{children}</main>
      </body>
    </html>
  );
}

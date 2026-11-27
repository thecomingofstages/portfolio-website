import type { Metadata } from "next";
import { Prompt, Sarabun } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
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
        <div className="min-h-screen md:flex">
          <Sidebar />
          <div className="min-w-0 flex-1 px-6">
            {/* The page being edited, and its Save and Discard, come from the page (HeaderSlot). Hidden while both are empty (the start). */}
            <header className="sticky top-0 z-20 pt-3 [&:not(:has(#header-title>*,#header-actions>*))]:hidden">
              {/* One look for everything in the bar: Prompt 600 at body size, controls 2rem tall. */}
              <div className="bar flex items-center gap-x-4 p-2 font-heading font-semibold sm:gap-x-6">
                <div id="header-title" className="flex min-w-0 flex-1 items-center" />
                <div id="header-actions" className="flex shrink-0 items-center" />
              </div>
            </header>
            <main className="py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Prompt, Sarabun } from "next/font/google";
import Reveal from "@/components/Reveal";
import Nav from "@/components/Nav";
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

// TODO(page titles and link previews): a title per page, and pics[0] as the preview image.
export const metadata: Metadata = {
  title: "The Coming of Stages",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-scroll-behavior: Next.js turns the smooth scroll (globals.css) off while it moves to a new page.
    <html lang="th" className={`${prompt.variable} ${sarabun.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <Nav />
        <main className="page-width py-8">{children}</main>
        <Reveal />
      </body>
    </html>
  );
}

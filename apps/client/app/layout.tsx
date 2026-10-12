import type { Metadata } from "next";
import { Prompt, Sarabun } from "next/font/google";
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
    <html lang="th" className={`${prompt.variable} ${sarabun.variable}`}>
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";

/** Small shared pieces of the editor's forms. */

/** Shown on the site: a lit gold mark. Hidden: an empty one, in grey. */
export function ShownMark({ shown }: { shown: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${shown ? "text-foreground" : "text-muted"}`}>
      <span
        aria-hidden
        className={`size-2 rounded-full border ${shown ? "border-accent bg-accent" : "border-muted bg-transparent"}`}
      />
      {shown ? "Shown" : "Hidden"}
    </span>
  );
}

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col">
      <span className="font-bold">{children}</span>
      {hint ? <span className="text-muted">{hint}</span> : null}
    </label>
  );
}

/** The answer of the last save: a success line, or the list of problems. */
export function SaveStatus({ result }: { result: { ok: true; message?: string } | { ok: false; errors: string[] } | null }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p role="status" className="text-green">
        {result.message ?? "Saved"}
      </p>
    );
  }
  return (
    <div role="alert" className="border-l-2 border-red pl-3 text-red">
      <p className="font-bold">Not saved. Fix this and save again:</p>
      <ul className="list-disc pl-5">
        {result.errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

/** Where a page shows on the public site, when SITE_URL is set. */
export function siteUrl(path: string): string | null {
  const base = process.env.SITE_URL;
  return base ? `${base.replace(/\/+$/, "")}${path}` : null;
}

export function SiteLink({ path }: { path: string }) {
  const href = siteUrl(path);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-muted underline hover:text-foreground">
      Open on the site
    </a>
  );
}

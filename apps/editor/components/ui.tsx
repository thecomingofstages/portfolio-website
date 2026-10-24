import type { ReactNode } from "react";

/** Small shared pieces of the editor's forms. */

export function ShownBadge({ shown }: { shown: boolean }) {
  return shown ? (
    <span className="rounded-[var(--radius-button)] border border-green px-1.5 text-green">Shown</span>
  ) : (
    <span className="rounded-[var(--radius-button)] border border-border px-1.5 text-muted">Hidden</span>
  );
}

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-0.5">
      <span className="font-heading font-semibold">{children}</span>
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
    <div role="alert" className="rounded-[var(--radius-card)] border border-red p-3 text-red">
      <p className="font-heading font-semibold">Not saved</p>
      <ul className="list-disc pl-5">
        {result.errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

/** Where a page shows on the public site, when SITE_URL is set. */
export function SiteLink({ path }: { path: string }) {
  const base = process.env.SITE_URL;
  if (!base) return null;
  return (
    <a href={`${base.replace(/\/+$/, "")}${path}`} target="_blank" rel="noreferrer" className="text-accent underline">
      View on site
    </a>
  );
}

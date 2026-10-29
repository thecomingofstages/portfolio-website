import type { ReactNode } from "react";
import { OFF_SITE_IMAGE } from "@/lib/media";

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

/** An on/off switch: a checkbox with `role="switch"`, drawn by the `switch` utility. */
export function Switch({
  id,
  checked,
  label,
  hint,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  hint?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <input id={id} type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
    </div>
  );
}

/** The star after a required field's label, in red. */
export function RequiredMark() {
  return <span className="text-red"> *</span>;
}

/** Under a picture URL from another website, which the site cannot show (lib/media.ts). */
export function OffSiteImageError({ id }: { id: string }) {
  return (
    <p id={id} className="text-red">
      {OFF_SITE_IMAGE}
    </p>
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

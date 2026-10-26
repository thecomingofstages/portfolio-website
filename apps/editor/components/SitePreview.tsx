import { siteUrl } from "@/components/ui";

/** A short fingerprint of the saved data: the frame reloads whenever it changes. */
function fingerprint(data: unknown): string {
  const text = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  return hash.toString(36);
}

/**
 * The page as the public site renders it, with the site's own components, at phone width.
 * It shows what is saved and shown: every save refreshes the server data, which changes the
 * frame's key, so the frame reloads after the server has refreshed the site's page.
 */
export default function SitePreview({ path, shown, data }: { path: string; shown: boolean; data: unknown }) {
  const src = siteUrl(path);
  return (
    <aside aria-labelledby="preview-heading" className="flex flex-col gap-2 lg:sticky lg:top-20">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="preview-heading">On the site</h2>
        {src && shown ? (
          <a href={src} target="_blank" rel="noreferrer" className="text-muted underline hover:text-foreground">
            Open in a new tab
          </a>
        ) : null}
      </div>
      {!src ? (
        <p className="text-muted">Set SITE_URL to see this page as the site shows it.</p>
      ) : !shown ? (
        <p className="text-muted">This is hidden, so the site answers “not found”. Show it and save to see it here.</p>
      ) : (
        <>
          <iframe
            key={fingerprint(data)}
            src={src}
            title={`${path} on the public site`}
            loading="lazy"
            className="h-[70vh] w-full rounded-[var(--radius-card)] border border-border bg-background lg:h-[calc(100vh-8rem)]"
          />
          <p className="text-muted">Saved changes only. Hidden blocks stay off the site.</p>
        </>
      )}
    </aside>
  );
}

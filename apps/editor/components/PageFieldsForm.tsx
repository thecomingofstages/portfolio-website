"use client";

import { useState, useTransition } from "react";
import { savePageFields } from "@/app/actions";
import { Label, SaveStatus } from "@/components/ui";
import type { ActionResult, PageDoc } from "@/types/admin";

/** A page's own fields: `title` and `is_shown`. */
export default function PageFieldsForm({ page }: { page: PageDoc }) {
  const [title, setTitle] = useState(page.title);
  const [shown, setShown] = useState(page.is_shown);
  const [seen, setSeen] = useState({ title: page.title, shown: page.is_shown });
  // New data from the server replaces the form (see BlocksEditor).
  if (seen.title !== page.title || seen.shown !== page.is_shown) {
    setSeen({ title: page.title, shown: page.is_shown });
    setTitle(page.title);
    setShown(page.is_shown);
  }
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = title !== page.title || shown !== page.is_shown;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => setResult(await savePageFields(page.key, { title, is_shown: shown })));
      }}
    >
      <div className="flex max-w-xl flex-col gap-1">
        <Label htmlFor="page-title">Title *</Label>
        <input id="page-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex items-start gap-2.5">
        <input id="page-shown" type="checkbox" className="mt-1" checked={shown} onChange={(e) => setShown(e.target.checked)} />
        <Label htmlFor="page-shown" hint="Off: the page answers “not found”">
          Shown on the site
        </Label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save page"}
        </button>
      </div>
      <SaveStatus result={result} />
    </form>
  );
}

"use client";

import { useState } from "react";
import { savePageFields } from "@/app/actions";
import { useSaveable } from "@/components/SaveGroup";
import { Label, SaveStatus, Switch } from "@/components/ui";
import { isAlwaysShown } from "@/lib/blocks";
import type { ActionResult, PageDoc } from "@/types/admin";

/** A page's own fields: `title`, and `is_shown` except on home, which is always shown. */
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
  const dirty = title !== page.title || shown !== page.is_shown;

  // Saved with the rest of the page, from the header (SaveGroup).
  useSaveable("page", {
    dirty,
    order: 2,
    save: async () => {
      const answer = await savePageFields(page.key, { title, is_shown: shown });
      setResult(answer);
      return answer.ok;
    },
    discard: () => {
      setTitle(page.title);
      setShown(page.is_shown);
      setResult(null);
    },
  });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => e.preventDefault()}
    >
      {isAlwaysShown(page.key) ? null : (
        <Switch id="page-shown" checked={shown} label="Shown on the site" hint="ถ้าปิด หน้านี้จะขึ้นว่าไม่พบหน้า" onChange={setShown} />
      )}
      <div className="flex max-w-xl flex-col gap-1">
        <Label htmlFor="page-title">Title *</Label>
        <input id="page-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      {result && !result.ok ? <SaveStatus result={result} /> : null}
    </form>
  );
}

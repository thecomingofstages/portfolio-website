"use client";

import { useId, useState, useTransition } from "react";
import FieldInput from "@/components/FieldInput";
import { HeaderSlot, useSaveable } from "@/components/SaveGroup";
import { SaveStatus, Switch } from "@/components/ui";
import type { UploadOwner } from "@/lib/admin-api";
import { FORMS } from "@/lib/forms";
import type { ActionResult } from "@/types/admin";

type Doc = Record<string, unknown>;

/** The <datalist> that `project_slug` fields suggest from. */
function Suggestions({ id, values }: { id: string; values: string[] }) {
  return (
    <datalist id={id}>
      {values.map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );
}

/**
 * A whole track or recruitment round as one form (docs/EDITOR.md). It saves with the
 * header's Save (SaveGroup): the whole document, so list items keep their ids.
 */
export function DocEditor({
  form,
  initial,
  save,
  uploadTo,
  projectSlugs,
}: {
  form: "track" | "round";
  /** The document as `formValue` gives it. */
  initial: Doc;
  save: (doc: Doc) => Promise<ActionResult>;
  uploadTo: UploadOwner;
  projectSlugs: string[];
}) {
  const initialJson = JSON.stringify(initial);
  const [doc, setDoc] = useState<Doc>(initial);
  const [seen, setSeen] = useState(initialJson);
  const [result, setResult] = useState<ActionResult | null>(null);
  // New data from the server replaces the form (see BlocksEditor).
  if (initialJson !== seen) {
    setSeen(initialJson);
    setDoc(initial);
    setResult(null);
  }
  const listId = useId();
  const specs = FORMS[form];

  useSaveable("doc", {
    dirty: JSON.stringify(doc) !== initialJson,
    order: 1,
    save: async () => {
      const answer = await save(doc);
      setResult(answer);
      return answer.ok;
    },
    discard: () => {
      setDoc(initial);
      setResult(null);
    },
  });

  return (
    <form className="@container flex max-w-3xl flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <Suggestions id={`${listId}-projects`} values={projectSlugs} />
      {/* In the line under the document's title (the page's #title-shown), as on a project's page. */}
      <HeaderSlot id="title-shown">
        <Switch
          id="doc-is_shown"
          checked={doc.is_shown === true}
          label="Shown on the site"
          onChange={(on) => setDoc({ ...doc, is_shown: on })}
        />
      </HeaderSlot>
      {result && !result.ok ? <SaveStatus result={result} /> : null}
      {specs.map((spec) =>
        spec.key === "is_shown" ? null : (
          <FieldInput
            key={spec.key}
            spec={spec}
            value={doc}
            idPrefix="doc"
            projectSlugsListId={`${listId}-projects`}
            uploadTo={uploadTo}
            onChange={setDoc}
          />
        ),
      )}
    </form>
  );
}

/** The required fields of a new track or round; it starts hidden. */
export function NewDocForm({
  form,
  initial,
  create,
  label,
}: {
  form: "new-track" | "new-round";
  initial: Doc;
  create: (doc: Doc) => Promise<ActionResult>;
  label: string;
}) {
  const [doc, setDoc] = useState<Doc>(initial);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const specs = FORMS[form];
  return (
    <form
      className="flex max-w-3xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => setResult(await create(doc)));
      }}
    >
      {specs.map((spec) => (
        <FieldInput key={spec.key} spec={spec} value={doc} idPrefix="new" onChange={setDoc} />
      ))}
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creating…" : label}
        </button>
      </div>
      {result ? <SaveStatus result={result} /> : null}
    </form>
  );
}

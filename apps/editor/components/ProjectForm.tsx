"use client";

import { useState, useTransition } from "react";
import { createProject, saveProjectFields } from "@/app/actions";
import FieldInput from "@/components/FieldInput";
import { Label, SaveStatus } from "@/components/ui";
import type { FieldSpec } from "@/lib/blocks";
import { type DateParts, fromDateParts, normalizeDate, toDateParts } from "@/lib/date-input";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/schemas";
import type { ActionResult, ProjectDoc } from "@/types/admin";

type Fields = Record<string, unknown>;

/** The fields a new project needs (the schema's required ones). */
const requiredFields: FieldSpec[] = [
  { kind: "text", key: "slug", label: "Slug", required: true, hint: "The URL key, e.g. tcos-2-the-hidden-saloon. Lowercase letters, digits and hyphens" },
  { kind: "text", key: "name", label: "Name", required: true, hint: "As announced" },
  { kind: "enum", key: "type", label: "Type", options: PROJECT_TYPES, required: true },
  { kind: "enum", key: "status", label: "Status", options: PROJECT_STATUSES, required: true },
];

const moreFields: FieldSpec[] = [
  { kind: "text", key: "venue", label: "Venue", nullable: true, hint: "The main venue. Several venues go in highlights" },
  { kind: "text", key: "summary", label: "Summary", multiline: true, hint: "One or two lines for project cards" },
  { kind: "strings", key: "pics", label: "Pictures", images: true, hint: "Image URLs, one per line. The first is the header and the shelf spine" },
  { kind: "text", key: "org_chart_image", label: "Org chart image", nullable: true, image: true },
];

function fieldsOf(project: ProjectDoc): Fields {
  return {
    slug: project.slug,
    name: project.name,
    type: project.type,
    status: project.status,
    start_date: normalizeDate(project.start_date),
    end_date: project.end_date ? normalizeDate(project.end_date) : null,
    venue: project.venue ?? null,
    summary: project.summary ?? "",
    pics: project.pics ?? [],
    org_chart_image: project.org_chart_image ?? null,
    is_yearbook_shown: project.is_yearbook_shown ?? false,
    is_shown: project.is_shown,
  };
}

const NEW_PROJECT: Fields = { slug: "", name: "", type: "", status: "", start_date: "", is_shown: false };

/**
 * A project's own fields (docs/EDITOR.md "What it edits"). Without `project`,
 * it creates a new one with the required fields only, hidden by default.
 */
export default function ProjectForm({ project }: { project?: ProjectDoc }) {
  const initial = project ? fieldsOf(project) : NEW_PROJECT;
  const initialJson = JSON.stringify(initial);
  const [fields, setFields] = useState<Fields>(initial);
  const [seen, setSeen] = useState(initialJson);
  // New data from the server replaces the form (see BlocksEditor).
  if (initialJson !== seen) {
    setSeen(initialJson);
    setFields(initial);
  }
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(fields) !== initialJson;
  const slugChanged = project && fields.slug !== project.slug;

  const field = (spec: FieldSpec) => (
    <FieldInput
      key={spec.key}
      spec={spec}
      value={fields}
      idPrefix="project"
      uploadTo={project ? { collection: "projects", owner: project.slug } : undefined}
      onChange={setFields}
    />
  );

  /** A date with an optional time, in Bangkok. An undecided value (e.g. "<...>") shows until a date is picked. */
  function dateField(key: "start_date" | "end_date", label: string, required: boolean) {
    const raw = typeof fields[key] === "string" ? (fields[key] as string) : "";
    const parts = raw === "" ? { date: "", time: "" } : toDateParts(raw);
    const set = (next: DateParts) =>
      setFields({ ...fields, [key]: next.date ? fromDateParts(next) : required ? "" : null });
    return (
      <fieldset className="flex flex-col gap-1">
        <legend className="font-bold">
          {label}
          {required ? " *" : ""}
        </legend>
        <span className="text-muted">
          {parts ? "Time is optional, in Bangkok time" : `Now “${raw}”: not decided yet. Pick a date to save.`}
        </span>
        <div className="flex gap-2">
          <input
            id={`project-${key}`}
            aria-label={`${label}: date`}
            type="date"
            value={parts?.date ?? ""}
            onChange={(e) => set({ date: e.target.value, time: parts?.time ?? "" })}
          />
          <input
            aria-label={`${label}: time`}
            type="time"
            className="max-w-36"
            value={parts?.time ?? ""}
            disabled={!parts?.date}
            onChange={(e) => set({ date: parts?.date ?? "", time: e.target.value })}
          />
        </div>
      </fieldset>
    );
  }

  function checkbox(key: "is_shown" | "is_yearbook_shown", label: string, hint: string) {
    return (
      <div className="flex items-start gap-2.5">
        <input
          id={`project-${key}`}
          type="checkbox"
          className="mt-1"
          checked={fields[key] === true}
          onChange={(e) => setFields({ ...fields, [key]: e.target.checked })}
        />
        <Label htmlFor={`project-${key}`} hint={hint}>
          {label}
        </Label>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          // An emptied summary is sent as "", so the stored one is cleared too.
          const sent = project ? { ...fields, summary: fields.summary ?? "" } : fields;
          setResult(project ? await saveProjectFields(project.slug, sent) : await createProject(sent));
        });
      }}
    >
      <div className="flex flex-col gap-5">
        {requiredFields.map(field)}
        {dateField("start_date", "Start date", true)}
        {project ? dateField("end_date", "End date", false) : null}
      </div>
      {project ? moreFields.map(field) : null}
      {checkbox("is_shown", "Shown on the site", "Off: left out of every list, and its page answers “not found”")}
      {project
        ? checkbox("is_yearbook_shown", "Yearbook shown", "Turns on /projects/<slug>/yearbook and its button")
        : null}
      {slugChanged ? (
        <p className="border-l-2 border-accent pl-3">
          Changing the slug changes the project&apos;s address. The server updates the references to it, but old
          shared links stop working.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={(project && !dirty) || pending}>
          {pending ? "Saving…" : project ? "Save project" : "Create project"}
        </button>
      </div>
      <SaveStatus result={result} />
    </form>
  );
}

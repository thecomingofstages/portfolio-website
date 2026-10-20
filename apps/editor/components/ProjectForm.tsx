"use client";

import { useState, useTransition } from "react";
import { createProject, saveProjectFields } from "@/app/actions";
import FieldInput from "@/components/FieldInput";
import { SaveStatus } from "@/components/ui";
import type { FieldSpec } from "@/lib/blocks";
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
  { kind: "strings", key: "pics", label: "Pictures", hint: "Image URLs, one per line. The first is the header and the shelf spine" },
  { kind: "text", key: "org_chart_image", label: "Org chart image URL", nullable: true },
];

/** `YYYY-MM-DD` from a stored ISO date; anything else (e.g. "<...>") as it is. */
function dateInput(value: string | null | undefined): string {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
}

function fieldsOf(project: ProjectDoc): Fields {
  return {
    slug: project.slug,
    name: project.name,
    type: project.type,
    status: project.status,
    start_date: dateInput(project.start_date),
    end_date: project.end_date ? dateInput(project.end_date) : null,
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
    <FieldInput key={spec.key} spec={spec} value={fields} idPrefix="project" onChange={setFields} />
  );

  function dateField(key: "start_date" | "end_date", label: string, required: boolean) {
    const value = typeof fields[key] === "string" ? (fields[key] as string) : "";
    const valid = value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value);
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={`project-${key}`} className="flex flex-col gap-0.5">
          <span className="font-heading font-semibold">
            {label}
            {required ? " *" : ""}
          </span>
          {!valid ? <span className="text-accent">Now “{value}”: not decided yet. Pick a date to save.</span> : null}
        </label>
        <input
          id={`project-${key}`}
          type="date"
          value={valid ? value : ""}
          onChange={(e) => setFields({ ...fields, [key]: e.target.value || (required ? "" : null) })}
        />
      </div>
    );
  }

  function checkbox(key: "is_shown" | "is_yearbook_shown", label: string, hint: string) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={`project-${key}`}
          type="checkbox"
          checked={fields[key] === true}
          onChange={(e) => setFields({ ...fields, [key]: e.target.checked })}
        />
        <label htmlFor={`project-${key}`} className="font-heading font-semibold">
          {label}
        </label>
        <span className="text-muted">{hint}</span>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          // An emptied summary is sent as "", so the stored one is cleared too.
          const sent = project ? { ...fields, summary: fields.summary ?? "" } : fields;
          setResult(project ? await saveProjectFields(project.slug, sent) : await createProject(sent));
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {requiredFields.map(field)}
        {dateField("start_date", "Start date", true)}
        {project ? dateField("end_date", "End date", false) : null}
      </div>
      {project ? moreFields.map(field) : null}
      {checkbox("is_shown", "Shown on the site", "Hidden: left out of every list, and its page answers 404")}
      {project
        ? checkbox("is_yearbook_shown", "Yearbook shown", "Turns on /projects/<slug>/yearbook and its button")
        : null}
      {slugChanged ? (
        <p className="text-accent">
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

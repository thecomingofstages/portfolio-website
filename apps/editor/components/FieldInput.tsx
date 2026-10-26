"use client";

import { useState } from "react";
import { Label } from "@/components/ui";
import UploadButton from "@/components/UploadButton";
import type { UploadOwner } from "@/lib/admin-api";
import { type FieldSpec, moveItem, parseStatValue, setField } from "@/lib/blocks";
import { type DateParts, fromDateParts, toDateParts } from "@/lib/date-input";

type Obj = Record<string, unknown>;

/**
 * One form field of a block (or of a list item in it), from its FieldSpec.
 * `value` is the whole object the field belongs to; `onChange` gets a new copy.
 */
export default function FieldInput({
  spec,
  value,
  onChange,
  idPrefix,
  projectSlugsListId,
  trackKeysListId,
  uploadTo,
}: {
  spec: FieldSpec;
  value: Obj;
  onChange: (next: Obj) => void;
  idPrefix: string;
  /** A <datalist> of project slugs, for `project_slug` fields. */
  projectSlugsListId?: string;
  /** A <datalist> of track keys, for `dept_key` fields. */
  trackKeysListId?: string;
  /** Where uploaded images are filed; without it, image fields take URLs only. */
  uploadTo?: UploadOwner;
}) {
  const id = `${idPrefix}-${spec.key}`;
  const current = value[spec.key];
  const set = (v: unknown) => onChange(setField(value, spec.key, v));
  const label = spec.kind !== "items" && "required" in spec && spec.required ? `${spec.label} *` : spec.label;

  switch (spec.kind) {
    case "text": {
      const text = typeof current === "string" ? current : "";
      const update = (t: string) => set(t !== "" || spec.required ? t : spec.nullable ? null : undefined);
      return (
        <div className="flex flex-col gap-1">
          <Label htmlFor={id} hint={spec.hint}>
            {label}
          </Label>
          {spec.multiline ? (
            <textarea id={id} rows={5} value={text} onChange={(e) => update(e.target.value)} />
          ) : (
            <input
              id={id}
              type="text"
              inputMode={spec.image ? "url" : undefined}
              value={text}
              placeholder={spec.image ? "https://" : undefined}
              onChange={(e) => update(e.target.value)}
              list={spec.key === "project_slug" ? projectSlugsListId : spec.key === "dept_key" ? trackKeysListId : undefined}
            />
          )}
          {spec.image && uploadTo ? <UploadButton to={uploadTo} onUploaded={update} /> : null}
        </div>
      );
    }

    case "enum": {
      const selected = typeof current === "string" ? current : "";
      const unknownValue = selected !== "" && !spec.options.includes(selected);
      return (
        <div className="flex flex-col gap-1">
          <Label htmlFor={id} hint={spec.hint}>
            {label}
          </Label>
          <select
            id={id}
            value={selected}
            onChange={(e) => set(e.target.value !== "" ? e.target.value : spec.nullable ? null : undefined)}
          >
            {spec.required ? null : <option value="">{spec.nullable ? "None" : "Not set"}</option>}
            {unknownValue ? <option value={selected}>{selected} (not a valid choice)</option> : null}
            {spec.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    case "int": {
      const shown = typeof current === "number" ? String(current) : "";
      return (
        <div className="flex flex-col gap-1">
          <Label htmlFor={id} hint={spec.hint}>
            {label}
          </Label>
          <input
            id={id}
            type="number"
            step={1}
            inputMode="numeric"
            value={shown}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              set(Number.isNaN(n) ? (spec.nullable ? null : undefined) : n);
            }}
          />
        </div>
      );
    }

    case "bool":
      return (
        <div className="flex items-start gap-2.5">
          <input id={id} type="checkbox" className="mt-1" checked={current === true} onChange={(e) => set(e.target.checked)} />
          <Label htmlFor={id} hint={spec.hint}>
            {spec.label}
          </Label>
        </div>
      );

    case "strings":
      return (
        <div className="flex flex-col gap-1">
          <StringsInput id={id} label={label} hint={spec.hint} value={current} onChange={set} />
          {spec.images && uploadTo ? (
            <UploadButton
              to={uploadTo}
              label="Upload and add"
              onUploaded={(url) => set([...(Array.isArray(current) ? current : []), url])}
            />
          ) : null}
        </div>
      );

    case "value": {
      const text = typeof current === "number" ? String(current) : typeof current === "string" ? current : "";
      return (
        <div className="flex flex-col gap-1">
          <Label htmlFor={id} hint={spec.hint}>
            {label}
          </Label>
          <input id={id} type="text" value={text} onChange={(e) => set(parseStatValue(e.target.value))} />
        </div>
      );
    }

    case "date": {
      const raw = typeof current === "string" ? current : "";
      const parts = raw === "" ? { date: "", time: "" } : toDateParts(raw);
      const setParts = (next: DateParts) => set(next.date ? fromDateParts(next) : spec.required ? "" : spec.nullable ? null : undefined);
      return (
        <fieldset className="flex flex-col gap-1">
          <legend className="font-bold">{label}</legend>
          <span className="text-muted">
            {parts ? (spec.hint ?? "จะใส่เวลาด้วยก็ได้ (เวลากรุงเทพฯ)") : `ตอนนี้เป็น "${raw}" คือยังไม่ได้กำหนด เลือกวันที่ก่อนบันทึก`}
          </span>
          <div className="flex gap-2">
            <input
              id={id}
              aria-label={`${spec.label}: date`}
              type="date"
              value={parts?.date ?? ""}
              onChange={(e) => setParts({ date: e.target.value, time: parts?.time ?? "" })}
            />
            <input
              aria-label={`${spec.label}: time`}
              type="time"
              className="max-w-36"
              value={parts?.time ?? ""}
              disabled={!parts?.date}
              onChange={(e) => setParts({ date: parts?.date ?? "", time: e.target.value })}
            />
          </div>
        </fieldset>
      );
    }

    case "object": {
      const obj = current && typeof current === "object" && !Array.isArray(current) ? (current as Obj) : null;
      if (!obj) {
        return (
          <div className="flex flex-col gap-1">
            <span className="font-bold">{spec.label}</span>
            {spec.hint ? <span className="text-muted">{spec.hint}</span> : null}
            <div>
              <button type="button" className="btn" onClick={() => set({})}>
                Add {spec.label.toLowerCase()}
              </button>
            </div>
          </div>
        );
      }
      return (
        <fieldset className="flex flex-col gap-3 border-l-2 border-border pl-4">
          <legend className="font-bold">{spec.label}</legend>
          {spec.hint ? <p className="text-muted">{spec.hint}</p> : null}
          {spec.fields.map((field) => (
            <FieldInput
              key={field.key}
              spec={field}
              value={obj}
              idPrefix={id}
              projectSlugsListId={projectSlugsListId}
              trackKeysListId={trackKeysListId}
              uploadTo={uploadTo}
              onChange={set}
            />
          ))}
          {spec.optional ? (
            <div>
              <button type="button" className="btn" onClick={() => set(undefined)}>
                Remove {spec.label.toLowerCase()}
              </button>
            </div>
          ) : null}
        </fieldset>
      );
    }

    case "items": {
      const items = Array.isArray(current) ? (current as Obj[]) : [];
      const setItems = (next: Obj[]) => set(next);
      const name = spec.itemLabel.toLowerCase();
      return (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-bold">{spec.label}</legend>
          {spec.hint ? <p className="text-muted">{spec.hint}</p> : null}
          {items.length === 0 ? <p className="text-muted">None yet.</p> : null}
          <ol className="flex flex-col gap-5">
            {items.map((item, index) => (
              <li key={index} className="flex flex-col gap-3 border-l-2 border-border pl-4">
                <div className="flex items-center gap-1">
                  <span className="mr-auto text-muted">
                    {spec.itemLabel} {index + 1}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Move ${name} ${index + 1} up`}
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => setItems(moveItem(items, index, index - 1))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Move ${name} ${index + 1} down`}
                    title="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => setItems(moveItem(items, index, index + 1))}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Remove ${name} ${index + 1}`}
                    title="Remove"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                </div>
                {spec.fields.map((field) => (
                  <FieldInput
                    key={field.key}
                    spec={field}
                    value={item}
                    idPrefix={`${id}-${index}`}
                    projectSlugsListId={projectSlugsListId}
                    trackKeysListId={trackKeysListId}
                    uploadTo={uploadTo}
                    onChange={(next) => setItems(items.map((it, i) => (i === index ? next : it)))}
                  />
                ))}
              </li>
            ))}
          </ol>
          <div>
            <button type="button" className="btn" onClick={() => setItems([...items, spec.newItem()])}>
              Add {name}
            </button>
          </div>
        </fieldset>
      );
    }
  }
}

/** A list of strings, one per line. Keeps its own text so blank lines can be typed. */
function StringsInput({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: unknown;
  onChange: (list: string[]) => void;
}) {
  const list = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const [text, setText] = useState(() => list.join("\n"));
  // A list changed from outside (an upload added a line) replaces the text.
  if (linesOf(text).join("\n") !== list.join("\n")) setText(list.join("\n"));
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={Math.max(2, list.length + 1)}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(linesOf(e.target.value));
        }}
      />
    </div>
  );
}

const linesOf = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

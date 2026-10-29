"use client";

import { useState } from "react";
import { Label, OffSiteImageError, Switch } from "@/components/ui";
import UploadButton from "@/components/UploadButton";
import type { UploadOwner } from "@/lib/admin-api";
import { type FieldSpec, moveItem, parseStatValue, setField } from "@/lib/blocks";
import { type DateParts, fromDateParts, toDateParts } from "@/lib/date-input";
import { isAllowedImage } from "@/lib/media";

type Obj = Record<string, unknown>;

/** A field: label above the control, or in a column beside it once the form is wide (DocEditor's `@container`). */
const ROW = "flex flex-col gap-1 @lg:grid @lg:grid-cols-[10rem_1fr] @lg:items-baseline @lg:gap-x-4 @lg:[&>:not(:first-child)]:col-start-2";
/** A group of fields: an object, or one item of a list. */
const CARD = "flex flex-col gap-3 rounded-card border border-border p-4";

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
  uploadTo,
}: {
  spec: FieldSpec;
  value: Obj;
  onChange: (next: Obj) => void;
  idPrefix: string;
  /** A <datalist> of project slugs, for `project_slug` fields. */
  projectSlugsListId?: string;
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
        <div className={ROW}>
          <Label htmlFor={id} hint={spec.hint}>
            {label}
          </Label>
          {spec.multiline ? (
            <textarea id={id} rows={5} value={text} onChange={(e) => update(e.target.value)} />
          ) : spec.image && value.media_kind !== "video" ? (
            // Not a hero video: it plays in a plain <video>, which takes any URL.
            <ImageUrlInput id={id} value={text} onChange={update} />
          ) : (
            <input
              id={id}
              type="text"
              value={text}
              onChange={(e) => update(e.target.value)}
              list={spec.key === "project_slug" ? projectSlugsListId : undefined}
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
        <div className={ROW}>
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
        <div className={ROW}>
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
        <div className="flex items-start gap-2.5 @lg:grid @lg:grid-cols-[10rem_1fr] @lg:gap-x-4">
          <Label htmlFor={id} hint={spec.hint}>
            {spec.label}
          </Label>
          <input
            id={id}
            type="checkbox"
            className="order-first mt-1 @lg:order-none @lg:justify-self-start"
            checked={current === true}
            onChange={(e) => set(e.target.checked)}
          />
        </div>
      );

    case "strings":
      return (
        <div className={ROW}>
          <StringsInput id={id} label={label} hint={spec.hint} value={current} images={spec.images} onChange={set} />
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
        <div className={ROW}>
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
        <div role="group" aria-labelledby={`${id}-label`} className={ROW}>
          <span id={`${id}-label`} className="flex flex-col">
            <span className="font-bold">{label}</span>
            {!parts ? (
              <span className="text-muted">Now &quot;{raw}&quot;, not decided yet. Pick a date before saving.</span>
            ) : spec.hint ? (
              <span className="text-muted">{spec.hint}</span>
            ) : null}
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
              aria-label={`${spec.label}: time, Bangkok`}
              title="Optional, Bangkok time"
              type="time"
              className="max-w-36"
              value={parts?.time ?? ""}
              disabled={!parts?.date}
              onChange={(e) => setParts({ date: parts?.date ?? "", time: e.target.value })}
            />
          </div>
        </div>
      );
    }

    case "object": {
      const obj = current && typeof current === "object" && !Array.isArray(current) ? (current as Obj) : null;
      if (!obj) {
        return (
          <div className={ROW}>
            <span className="flex flex-col">
              <span className="font-bold">{spec.label}</span>
              {spec.hint ? <span className="text-muted">{spec.hint}</span> : null}
            </span>
            <div>
              <button type="button" className="btn" onClick={() => set({})}>
                Add {spec.label.toLowerCase()}
              </button>
            </div>
          </div>
        );
      }
      return (
        <div role="group" aria-labelledby={`${id}-label`} className={CARD}>
          <div className="flex flex-wrap items-center gap-1">
            <span id={`${id}-label`} className="mr-auto font-bold">
              {spec.label}
            </span>
            {spec.optional ? (
              <button type="button" className="btn" onClick={() => set(undefined)}>
                Remove {spec.label.toLowerCase()}
              </button>
            ) : null}
          </div>
          {spec.hint ? <p className="text-muted">{spec.hint}</p> : null}
          {spec.fields.map((field) => (
            <FieldInput
              key={field.key}
              spec={field}
              value={obj}
              idPrefix={id}
              projectSlugsListId={projectSlugsListId}
              uploadTo={uploadTo}
              onChange={set}
            />
          ))}
        </div>
      );
    }

    case "items": {
      const items = Array.isArray(current) ? (current as Obj[]) : [];
      const setItems = (next: Obj[]) => set(next);
      const name = spec.itemLabel.toLowerCase();
      const shown = spec.fields.find((f) => f.key === "is_shown" && f.kind === "bool");
      const fields = spec.fields.filter((f) => f !== shown);
      const setItem = (index: number, next: Obj) => setItems(items.map((it, i) => (i === index ? next : it)));
      return (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-bold">{spec.label}</legend>
          {spec.hint ? <p className="text-muted">{spec.hint}</p> : null}
          {items.length === 0 ? <p className="text-muted">None yet.</p> : null}
          <ol className="flex flex-col gap-5">
            {items.map((item, index) => (
              <li key={index} className={CARD}>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-auto whitespace-nowrap text-muted">
                    {spec.itemLabel} {index + 1}
                  </span>
                  {shown ? (
                    <div className="mr-2 whitespace-nowrap">
                      <Switch
                        id={`${id}-${index}-${shown.key}`}
                        checked={item[shown.key] === true}
                        label={shown.label}
                        onChange={(on) => setItem(index, setField(item, shown.key, on))}
                      />
                    </div>
                  ) : null}
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
                {fields.map((field) => (
                  <FieldInput
                    key={field.key}
                    spec={field}
                    value={item}
                    idPrefix={`${id}-${index}`}
                    projectSlugsListId={projectSlugsListId}
                          uploadTo={uploadTo}
                    onChange={(next) => setItem(index, next)}
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

/**
 * A list of strings, one per line; a text list shows each line as a bullet. Keeps its own text
 * so blank lines can be typed.
 */
function StringsInput({
  id,
  label,
  hint,
  value,
  images,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: unknown;
  /** Picture URLs: a line from another website holds the whole list back (isAllowedImage). */
  images?: boolean;
  onChange: (list: string[]) => void;
}) {
  const list = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const [text, setText] = useState(() => textOf(list, images));
  // A list changed from outside (an upload added a line) replaces the text.
  const lines = linesOf(text);
  const allowed = !images || lines.every(isAllowedImage);
  if (allowed && lines.join("\n") !== list.join("\n")) setText(textOf(list, images));
  const change = (next: string) => {
    setText(next);
    const nextLines = linesOf(next);
    if (!images || nextLines.every(isAllowedImage)) onChange(nextLines);
  };
  return (
    <>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={Math.max(2, list.length + 1)}
        value={text}
        aria-invalid={!allowed}
        aria-describedby={allowed ? undefined : `${id}-error`}
        onFocus={() => {
          if (!images && text === "") setText(BULLET);
        }}
        onKeyDown={(e) => {
          // Enter starts the next bullet; not while a Thai input method is composing.
          if (images || e.key !== "Enter" || e.nativeEvent.isComposing) return;
          e.preventDefault();
          const box = e.currentTarget;
          box.setRangeText(`\n${BULLET}`, box.selectionStart, box.selectionEnd, "end");
          change(box.value);
        }}
        onChange={(e) => change(e.target.value)}
      />
      {allowed ? null : <OffSiteImageError id={`${id}-error`} />}
    </>
  );
}

const BULLET = "• ";

const textOf = (list: string[], images?: boolean) => (images ? list : list.map((line) => BULLET + line)).join("\n");

export const linesOf = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^\s*•/, "").trim())
    .filter(Boolean);

/**
 * A picture URL. A URL from another website stays in the box with a message and is passed on
 * as empty, so the page in the frame never gets a picture it cannot show.
 */
function ImageUrlInput({ id, value, onChange }: { id: string; value: string; onChange: (url: string) => void }) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  // A value changed from outside (an upload, a discard) replaces the text; this box's own does not.
  if (seen !== value) {
    setSeen(value);
    setText(value);
  }
  const allowed = isAllowedImage(text);
  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="url"
        placeholder="https://"
        value={text}
        aria-invalid={!allowed}
        aria-describedby={allowed ? undefined : `${id}-error`}
        onChange={(e) => {
          setText(e.target.value);
          // A refused URL counts as no picture, so a save never keeps a half-typed one.
          const sent = isAllowedImage(e.target.value) ? e.target.value : "";
          setSeen(sent);
          onChange(sent);
        }}
      />
      {allowed ? null : <OffSiteImageError id={`${id}-error`} />}
    </>
  );
}

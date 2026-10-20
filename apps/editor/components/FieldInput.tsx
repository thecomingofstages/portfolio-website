"use client";

import { useState } from "react";
import { Label } from "@/components/ui";
import { type FieldSpec, moveItem, parseStatValue, setField } from "@/lib/blocks";

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
}: {
  spec: FieldSpec;
  value: Obj;
  onChange: (next: Obj) => void;
  idPrefix: string;
  /** A <datalist> of project slugs, for `project_slug` fields. */
  projectSlugsListId?: string;
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
              value={text}
              onChange={(e) => update(e.target.value)}
              list={spec.key === "project_slug" ? projectSlugsListId : undefined}
            />
          )}
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
        <div className="flex items-center gap-2">
          <input id={id} type="checkbox" checked={current === true} onChange={(e) => set(e.target.checked)} />
          <label htmlFor={id} className="font-heading font-semibold">
            {spec.label}
          </label>
          {spec.hint ? <span className="text-muted">{spec.hint}</span> : null}
        </div>
      );

    case "strings":
      return <StringsInput id={id} label={label} hint={spec.hint} value={current} onChange={set} />;

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

    case "items": {
      const items = Array.isArray(current) ? (current as Obj[]) : [];
      const setItems = (next: Obj[]) => set(next);
      return (
        <fieldset className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border p-3">
          <legend className="px-1 font-heading font-semibold">{spec.label}</legend>
          {spec.hint ? <p className="text-muted">{spec.hint}</p> : null}
          {items.length === 0 ? <p className="text-muted">None yet.</p> : null}
          {items.map((item, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-card-bg p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading font-semibold">
                  {spec.itemLabel} {index + 1}
                </span>
                <span className="ml-auto flex gap-1">
                  <button
                    type="button"
                    className="btn"
                    aria-label={`Move ${spec.itemLabel.toLowerCase()} ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => setItems(moveItem(items, index, index - 1))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn"
                    aria-label={`Move ${spec.itemLabel.toLowerCase()} ${index + 1} down`}
                    disabled={index === items.length - 1}
                    onClick={() => setItems(moveItem(items, index, index + 1))}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn"
                    aria-label={`Remove ${spec.itemLabel.toLowerCase()} ${index + 1}`}
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </span>
              </div>
              {spec.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  spec={field}
                  value={item}
                  idPrefix={`${id}-${index}`}
                  projectSlugsListId={projectSlugsListId}
                  onChange={(next) => setItems(items.map((it, i) => (i === index ? next : it)))}
                />
              ))}
            </div>
          ))}
          <div>
            <button type="button" className="btn" onClick={() => setItems([...items, spec.newItem()])}>
              Add {spec.itemLabel.toLowerCase()}
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
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          );
        }}
      />
    </div>
  );
}

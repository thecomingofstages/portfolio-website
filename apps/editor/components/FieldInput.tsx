"use client";

import { type ReactNode, useState } from "react";
import { MediaDialog, MediaPreview } from "@/components/BlockDialogs";
import { Label, RequiredMark, Switch } from "@/components/ui";
import type { UploadOwner } from "@/lib/admin-api";
import { type FieldSpec, moveItem, parseStatValue, setField } from "@/lib/blocks";
import { type DateParts, fromDateParts, toDateParts } from "@/lib/date-input";

type Obj = Record<string, unknown>;

/** A field: label above the control, or in a column beside it once the form is wide (DocEditor's `@container`). */
const ROW = "flex flex-col gap-1 @lg:grid @lg:grid-cols-[10rem_1fr] @lg:items-baseline @lg:gap-x-4 @lg:[&>:not(:first-child)]:col-start-2";
/** A group of fields: an object, or one item of a list. */
const CARD = "flex flex-col gap-3 rounded-card border border-border p-4";

/** The form's own words (buttons, notes); the field labels come from the FieldSpecs. */
export type Words = {
  add: (name: string) => string;
  remove: (name: string) => string;
  noneYet: string;
  moveUp: string;
  moveDown: string;
  removeItem: string;
  uploadImage: string;
  changeMedia: string;
  uploadAndAdd: string;
  undecided: (raw: string) => string;
  time: string;
  shown: string;
  noProject: string;
};

export const WORDS = {
  en: {
    add: (name) => `Add ${name.toLowerCase()}`,
    remove: (name) => `Remove ${name.toLowerCase()}`,
    noneYet: "None yet.",
    moveUp: "Move up",
    moveDown: "Move down",
    removeItem: "Remove",
    uploadImage: "Add picture",
    changeMedia: "Change",
    uploadAndAdd: "Add picture",
    undecided: (raw) => `Now "${raw}", not decided yet. Pick a date before saving.`,
    time: "Optional, Bangkok time",
    shown: "Shown on the site",
    noProject: "None",
  },
  th: {
    add: (name) => `เพิ่ม${name}`,
    remove: (name) => `ลบ${name}`,
    noneYet: "ยังไม่มี",
    moveUp: "เลื่อนขึ้น",
    moveDown: "เลื่อนลง",
    removeItem: "ลบ",
    uploadImage: "เพิ่มรูป",
    changeMedia: "เปลี่ยน",
    uploadAndAdd: "เพิ่มรูป",
    undecided: (raw) => `ตอนนี้เป็น "${raw}" คือยังไม่ได้กำหนด เลือกวันที่ก่อนบันทึก`,
    time: "ไม่ใส่ก็ได้ เวลากรุงเทพฯ",
    shown: "แสดงบนเว็บ",
    noProject: "ไม่ผูกกับโปรเจกต์",
  },
} satisfies Record<string, Words>;

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
  projectOptions,
  uploadTo,
  words = WORDS.en,
  heading,
}: {
  spec: FieldSpec;
  value: Obj;
  onChange: (next: Obj) => void;
  idPrefix: string;
  /** A <datalist> of project slugs, for `project_slug` fields. */
  projectSlugsListId?: string;
  /** The projects a `project_slug` field picks from, as a dropdown; without it, a text box. */
  projectOptions?: { slug: string; name: string }[];
  /** Where uploaded images are filed; without it, image fields take media bucket links only. */
  uploadTo?: UploadOwner;
  /** The form's language for its buttons and notes. */
  words?: Words;
  /** A list's label as a heading (<h3>): a list at the top of a document's form. */
  heading?: boolean;
}) {
  const id = `${idPrefix}-${spec.key}`;
  const current = value[spec.key];
  const set = (v: unknown) => onChange(setField(value, spec.key, v));
  const label =
    spec.kind !== "items" && "required" in spec && spec.required ? (
      <>
        {spec.label}
        <RequiredMark />
      </>
    ) : (
      spec.label
    );

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
          ) : spec.key === "project_slug" && projectOptions ? (
            <select id={id} value={text} onChange={(e) => update(e.target.value)}>
              <option value="">{words.noProject}</option>
              {/* A project the list does not have (deleted, renamed) stays chosen until it is changed. */}
              {text !== "" && !projectOptions.some((p) => p.slug === text) ? <option value={text}>{text}</option> : null}
              {projectOptions.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : spec.image ? (
            <MediaInput id={id} value={text} uploadTo={uploadTo} video={value.media_kind === "video"} words={words} onChange={update} />
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
          {spec.images ? (
            <MediaListInput id={id} label={label} hint={spec.hint} value={current} uploadTo={uploadTo} words={words} onChange={set} />
          ) : (
            <StringsInput id={id} label={label} hint={spec.hint} value={current} onChange={set} />
          )}
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
              <span className="text-muted">{words.undecided(raw)}</span>
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
              aria-label={`${spec.label}: ${words.time}`}
              title={words.time}
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
                {words.add(spec.label)}
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
                {words.remove(spec.label)}
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
              words={words}
              onChange={set}
            />
          ))}
        </div>
      );
    }

    case "items": {
      const items = Array.isArray(current) ? (current as Obj[]) : [];
      const setItems = (next: Obj[]) => set(next);
      const shown = spec.fields.find((f) => f.key === "is_shown" && f.kind === "bool");
      const fields = spec.fields.filter((f) => f !== shown);
      const setItem = (index: number, next: Obj) => setItems(items.map((it, i) => (i === index ? next : it)));
      return (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-bold">{heading ? <h3>{spec.label}</h3> : spec.label}</legend>
          {spec.hint ? <p className="text-muted">{spec.hint}</p> : null}
          {items.length === 0 ? <p className="text-muted">{words.noneYet}</p> : null}
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
                  <MoveRemoveButtons
                    name={`${spec.itemLabel} ${index + 1}`}
                    index={index}
                    count={items.length}
                    arrows={["↑", "↓"]}
                    words={words}
                    onMove={(to) => setItems(moveItem(items, index, to))}
                    onRemove={() => setItems(items.filter((_, i) => i !== index))}
                  />
                </div>
                {fields.map((field) => (
                  <FieldInput
                    key={field.key}
                    spec={field}
                    value={item}
                    idPrefix={`${id}-${index}`}
                    projectSlugsListId={projectSlugsListId}
                    uploadTo={uploadTo}
                    words={words}
                    onChange={(next) => setItem(index, next)}
                  />
                ))}
              </li>
            ))}
          </ol>
          <div>
            <button type="button" className="btn" onClick={() => setItems([...items, spec.newItem()])}>
              {words.add(spec.itemLabel)}
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
  onChange,
}: {
  id: string;
  label: ReactNode;
  hint?: string;
  value: unknown;
  onChange: (list: string[]) => void;
}) {
  const list = stringsOf(value);
  const [text, setText] = useState(() => textOf(list));
  // A list changed from outside (a discard) replaces the text.
  if (linesOf(text).join("\n") !== list.join("\n")) setText(textOf(list));
  const change = (next: string) => {
    setText(next);
    onChange(linesOf(next));
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
        onFocus={() => {
          if (text === "") setText(BULLET);
        }}
        onKeyDown={(e) => {
          // Not while a Thai input method is composing.
          if (e.nativeEvent.isComposing) return;
          const box = e.currentTarget;
          const at = box.selectionStart;
          if (e.key === "Enter") {
            // Enter starts the next bullet.
            e.preventDefault();
            box.setRangeText(`\n${BULLET}`, at, box.selectionEnd, "end");
          } else if ((e.key === "Backspace" || e.key === "Delete") && at === box.selectionEnd) {
            // Backspace in a bullet, or Delete at a line's end, joins the lines: the bullet goes with the line break.
            const lineStart = box.value.lastIndexOf("\n", at - 1) + 1;
            const inBullet = e.key === "Backspace" && at > lineStart && at <= lineStart + BULLET.length;
            const beforeBullet = e.key === "Delete" && box.value.startsWith(`\n${BULLET}`, at);
            if (!inBullet && !beforeBullet) return;
            e.preventDefault();
            if (beforeBullet) box.setRangeText("", at, at + 1 + BULLET.length, "start");
            else if (lineStart > 0) box.setRangeText("", lineStart - 1, lineStart + BULLET.length, "start");
            // The first bullet goes only with the last of the text.
            else if (box.value === BULLET) box.value = "";
            else return;
          } else return;
          change(box.value);
        }}
        onChange={(e) => {
          // A bullet deleted any other way (a selection, cutting) comes back, the cursor where it was.
          const box = e.currentTarget;
          const next = bulleted(box.value);
          if (next !== box.value) {
            const before = box.value.slice(0, box.selectionStart);
            const at = before === "" ? BULLET.length : bulleted(before).length;
            box.value = next;
            box.setSelectionRange(at, at);
          }
          change(next);
        }}
      />
    </>
  );
}

const BULLET = "• ";

/** Every line of `text` starting with one bullet (`• `); no text stays no text. */
export const bulleted = (text: string) =>
  text === "" ? "" : text.split("\n").map((line) => BULLET + line.replace(/^• ?/, "")).join("\n");

const textOf = (list: string[]) => list.map((line) => BULLET + line).join("\n");

const stringsOf = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []);

export const linesOf = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^\s*•/, "").trim())
    .filter(Boolean);

/** Move back, move forward and remove, for one item of a list; `name` ends each button's label. */
function MoveRemoveButtons({
  name,
  index,
  count,
  arrows,
  words,
  onMove,
  onRemove,
}: {
  name: string;
  index: number;
  count: number;
  arrows: [back: string, forward: string];
  words: Words;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="btn-icon"
        aria-label={`${words.moveUp}: ${name}`}
        title={words.moveUp}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
      >
        {arrows[0]}
      </button>
      <button
        type="button"
        className="btn-icon"
        aria-label={`${words.moveDown}: ${name}`}
        title={words.moveDown}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
      >
        {arrows[1]}
      </button>
      <button type="button" className="btn-icon" aria-label={`${words.removeItem}: ${name}`} title={words.removeItem} onClick={onRemove}>
        ✕
      </button>
    </>
  );
}

/** One picture (or hero video) field: what it holds, a button that opens MediaDialog, and Remove. */
function MediaInput({
  id,
  value,
  uploadTo,
  video,
  words,
  onChange,
}: {
  id: string;
  value: string;
  uploadTo?: UploadOwner;
  video: boolean;
  words: Words;
  onChange: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? <MediaPreview url={value} /> : null}
      <button id={id} type="button" className="btn" onClick={() => setOpen(true)}>
        {value ? words.changeMedia : words.uploadImage}
      </button>
      {value ? (
        <button type="button" className="btn" onClick={() => onChange("")}>
          {words.removeItem}
        </button>
      ) : null}
      {open ? (
        <MediaDialog
          current={value}
          uploadTo={uploadTo}
          video={video}
          canRemove={false}
          onPick={(url) => {
            if (url !== null) onChange(url);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

/** A list of pictures, in order: each with move and remove, and a button that adds one through MediaDialog. */
function MediaListInput({
  id,
  label,
  hint,
  value,
  uploadTo,
  words,
  onChange,
}: {
  id: string;
  label: ReactNode;
  hint?: string;
  value: unknown;
  uploadTo?: UploadOwner;
  words: Words;
  onChange: (list: string[]) => void;
}) {
  const list = stringsOf(value);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <div className="flex flex-col items-start gap-2">
        {list.length > 0 ? (
          <ol className="flex flex-wrap gap-3">
            {list.map((url, index) => (
              <li key={`${index}-${url}`} className="flex flex-col items-start gap-1">
                <MediaPreview url={url} />
                <div className="flex">
                  <MoveRemoveButtons
                    name={String(index + 1)}
                    index={index}
                    count={list.length}
                    arrows={["←", "→"]}
                    words={words}
                    onMove={(to) => onChange(moveItem(list, index, to))}
                    onRemove={() => onChange(list.filter((_, i) => i !== index))}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        <button id={id} type="button" className="btn" onClick={() => setOpen(true)}>
          {words.uploadAndAdd}
        </button>
      </div>
      {open ? (
        <MediaDialog
          current=""
          uploadTo={uploadTo}
          canRemove={false}
          onPick={(url) => {
            if (url) onChange([...list, url]);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

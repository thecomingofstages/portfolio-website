"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

/**
 * One Save and one Discard for everything on an edit page: the blocks and the page's or project's
 * own fields. Each part registers what it has unsaved with `useSaveable`; the header's buttons
 * (`SaveButtons`) save or discard all of it. Parts save in `order`, lowest first.
 */

export type Saveable = {
  dirty: boolean;
  /** Saves this part; true when it worked. A failure shows its own message next to the part. */
  save: () => Promise<boolean>;
  discard: () => void;
  /** The blocks save before the project's fields: a new slug moves the page to a new address. */
  order: number;
};

type Group = {
  register: (id: string, part: { current: Saveable }) => () => void;
  setDirty: (id: string, dirty: boolean) => void;
};

const GroupContext = createContext<Group | null>(null);
const StateContext = createContext<{ dirty: boolean; pending: boolean; failed: boolean; saveAll: () => void; discardAll: () => void } | null>(
  null,
);

export function SaveGroup({ children }: { children: ReactNode }) {
  const parts = useRef(new Map<string, { current: Saveable }>());
  const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = dirtyIds.size > 0;

  const group = useMemo<Group>(
    () => ({
      register: (id, part) => {
        parts.current.set(id, part);
        return () => {
          parts.current.delete(id);
          setDirtyIds((ids) => (ids.has(id) ? new Set([...ids].filter((x) => x !== id)) : ids));
        };
      },
      setDirty: (id, isDirty) =>
        setDirtyIds((ids) => {
          if (ids.has(id) === isDirty) return ids;
          const next = new Set(ids);
          if (isDirty) next.add(id);
          else next.delete(id);
          return next;
        }),
    }),
    [],
  );

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const toSave = [...parts.current.values()].map((p) => p.current).filter((p) => p.dirty).sort((a, b) => a.order - b.order);
      let ok = true;
      for (const part of toSave) ok = (await part.save()) && ok;
      setFailed(!ok);
    });
  }, []);

  const discardAll = useCallback(() => {
    if (!window.confirm("Discard every change since the last save?")) return;
    for (const part of parts.current.values()) part.current.discard();
    setFailed(false);
  }, []);

  return (
    <GroupContext.Provider value={group}>
      <StateContext.Provider value={{ dirty, pending, failed, saveAll, discardAll }}>{children}</StateContext.Provider>
    </GroupContext.Provider>
  );
}

/** Registers one part of the page with the SaveGroup around it. */
export function useSaveable(id: string, part: Saveable) {
  const group = useContext(GroupContext);
  const latest = useRef(part);
  useEffect(() => {
    latest.current = part;
  });
  useEffect(() => group?.register(id, latest), [group, id]);
  useEffect(() => group?.setDirty(id, part.dirty), [group, id, part.dirty]);
}

/** The header's Save and Discard, with what state the page is in. */
export function SaveButtons() {
  const state = useContext(StateContext);
  if (!state) return null;
  const { dirty, pending, failed, saveAll, discardAll } = state;
  return (
    <div className="flex items-center gap-2">
      <span role="status" className={`hidden whitespace-nowrap md:inline ${failed ? "text-red" : "text-muted"}`}>
        {pending ? "Saving…" : failed ? "Not saved: see the messages" : dirty ? "Unsaved changes" : "All saved"}
      </span>
      <button type="button" className="btn h-8 py-0" disabled={!dirty || pending} onClick={discardAll}>
        Discard
      </button>
      <button type="button" className="btn btn-primary h-8 py-0" disabled={!dirty || pending} onClick={saveAll}>
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

/** Puts its children into a slot in the layout's header (`id`), from inside a page. */
export function HeaderSlot({ id, children }: { id: "header-title" | "header-actions" | "title-shown"; children: ReactNode }) {
  // The slot is in the layout, so it exists in the browser and never changes; on the server there is none.
  const slot = useSyncExternalStore(noSubscription, () => document.getElementById(id), () => null);
  return slot ? createPortal(children, slot) : null;
}

const noSubscription = () => () => {};

/** The page being edited, in the header, with a back button to the previous page (or the start). */
export function BackTitle({ title }: { title: string }) {
  const router = useRouter();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        className="btn-icon"
        aria-label="Back"
        title="Back"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      >
        <svg aria-hidden viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M10 3 5 8l5 5" />
        </svg>
      </button>
      <span className="truncate">{title}</span>
    </div>
  );
}

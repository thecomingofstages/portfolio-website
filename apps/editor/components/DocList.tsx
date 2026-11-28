import Link from "next/link";
import { ShownMark } from "@/components/ui";

type Row = { href: string; name: string; detail?: string; shown: boolean };

/** One kind of document: its heading, a create button, and one row per document, hidden ones too. */
export function DocList({ title, create, empty, rows }: { title: string; create: { href: string; label: string }; empty: string; rows: Row[] }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-extrabold">{title}</h1>
        <Link href={create.href} className="btn btn-primary">
          {create.label}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">{empty}</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-card px-3 py-3 hover:bg-card-bg"
              >
                <span className="font-heading text-body-lg font-semibold">{row.name}</span>
                {row.detail ? <span className="text-muted">{row.detail}</span> : null}
                <span className="ml-auto">
                  <ShownMark shown={row.shown} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

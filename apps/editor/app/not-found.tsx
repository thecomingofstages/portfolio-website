import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1>Not found</h1>
      <p className="text-muted">There is no such page or project. It may have been renamed.</p>
      <Link href="/" className="text-accent underline">
        Back to all pages and projects
      </Link>
    </div>
  );
}

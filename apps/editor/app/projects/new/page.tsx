import Link from "next/link";
import ProjectForm from "@/components/ProjectForm";

export default function NewProject() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-muted hover:text-foreground">
          All pages and projects
        </Link>
        <h1>New project</h1>
        <p className="max-w-prose text-muted">
          Only the fields a project needs to exist. Pictures, the venue and the blocks come next, on the project&apos;s
          own page. It starts hidden, so the site does not show it until you are ready.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}

import Link from "next/link";
import ProjectForm from "@/components/ProjectForm";

export default function NewProject() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-muted hover:text-foreground">
          ← All pages and projects
        </Link>
        <h1>New project</h1>
        <p className="text-muted">
          Only the required fields. The rest, and the blocks, are on the project&apos;s page once it exists. A new
          project starts hidden.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}

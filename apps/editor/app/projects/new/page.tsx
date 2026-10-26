import ProjectForm from "@/components/ProjectForm";
import { BackTitle, HeaderSlot } from "@/components/SaveGroup";

export default function NewProject() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <HeaderSlot id="header-title">
          <BackTitle title="New project" />
        </HeaderSlot>
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

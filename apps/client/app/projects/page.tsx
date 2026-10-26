import { connection } from "next/server";
import Shelf from "@/components/Shelf";
import { getProjects } from "@/lib/api";

/**
 * Project list (task 1.15): every shown project on the Shelf, with the year
 * filter and the reverse toggle on. No project shown is an empty shelf, never
 * a 404 (docs/FRONTEND.md "Paths").
 *
 * Rendered per request, as Home is: otherwise the build prerenders it and
 * calls the API, which builds do not have.
 */
export default async function ProjectsPage() {
  await connection();
  const projects = await getProjects();

  return (
    <>
      <h1 className="sr-only">Projects</h1>
      <Shelf projects={projects} showFilter showToggle />
    </>
  );
}

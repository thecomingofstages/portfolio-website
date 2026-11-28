import { redirect } from "next/navigation";

/** The editor starts on the landing page, the sidebar's first item. */
export default function Start() {
  redirect("/pages/home");
}

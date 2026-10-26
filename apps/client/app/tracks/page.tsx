import { connection } from "next/server";
import TrackList from "@/components/TrackList";
import { getTracks } from "@/lib/api";

/**
 * Track list (task 3.1): the shown tracks, by `order`. Never a 404; any API
 * error goes to app/error.tsx.
 *
 * Rendered per request, not at build time, like Home: builds have no API_URL.
 */
export default async function TracksPage() {
  await connection();
  const tracks = await getTracks();

  return (
    <div className="flex flex-col gap-6 py-8">
      {/* TODO(/tracks heading wording): "Tracks" is the Nav label for now. */}
      <h1>Tracks</h1>
      <TrackList tracks={tracks} />
    </div>
  );
}

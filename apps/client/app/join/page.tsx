import { connection } from "next/server";
import Join, { JOIN_EMPTY_TEXT } from "@/components/blocks/Join";
import { getOpenRounds } from "@/lib/api";

/**
 * Apply info (task 2.6): the open rounds from `GET /api/join`, in the order sent
 * (closing soonest first). Never a 404: with no open round it shows the
 * client's empty-state message. Any API error goes to app/error.tsx.
 *
 * Rendered per request, not at build time, like Home: builds have no API_URL,
 * and a round that opens or closes shows at once (docs/FRONTEND.md "Keeping pages fresh").
 */
export default async function JoinPage() {
  await connection();
  const rounds = await getOpenRounds();

  return (
    <div className="flex flex-col gap-6 py-8">
      {/* TODO(/join heading wording): "Join" is the Nav label for now. */}
      <h1>Join</h1>
      <Join block={{ id: "join", type: "join", title: null, project_slug: null, empty_text: JOIN_EMPTY_TEXT, rounds }} />
    </div>
  );
}

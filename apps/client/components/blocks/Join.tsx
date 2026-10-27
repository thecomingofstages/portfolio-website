import RoundCard from "@/components/join/RoundCard";
import type { BlockProps } from ".";

export const JOIN_EMPTY_TEXT = "<...>";

export default function Join({ block }: BlockProps<"join">) {
  const { title, rounds, empty_text } = block;

  if (rounds.length === 0 && !empty_text) return null;

  return (
    <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8">
      {title ? <h2 className="font-heading text-h2 font-bold text-foreground">{title}</h2> : null}

      {rounds.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {rounds.map((round, index) => (
            <li key={`${round.title}-${round.opens_at}-${index}`}>
              <RoundCard round={round} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body text-body text-muted">{empty_text}</p>
      )}
    </div>
  );
}

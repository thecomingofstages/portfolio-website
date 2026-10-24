import Media from "@/components/Media";
import type { Sponsor } from "@/types/api";
import type { BlockProps } from ".";

type TierGroup = {
  tier: string | null;
  items: Sponsor[];
};

/**
 * Groups sponsors by tier while preserving the order received from the API.
 * Sponsors with null or empty tier are collected under tier: null.
 */
function groupSponsorsByTier(sponsors: Sponsor[]): TierGroup[] {
  const groups: TierGroup[] = [];
  const map = new Map<string | null, TierGroup>();

  for (const sponsor of sponsors) {
    const key = sponsor.tier && sponsor.tier.trim() !== "" ? sponsor.tier : null;
    let group = map.get(key);
    if (!group) {
      group = { tier: key, items: [] };
      map.set(key, group);
      groups.push(group);
    }
    group.items.push(sponsor);
  }

  return groups;
}

/**
 * Sponsors block (docs/DATABASE.md "sponsors", task 1.11).
 *
 * Shows every sponsor's name, and their logo only if the API sends one.
 * If sponsors have tiers, groups them by tier with headings.
 * If sponsors is empty, renders nothing.
 *
 * Responsive:
 * - Mobile (< 768px): 2 columns, compact padding (p-3 sm:p-4), subtle tap active state.
 * - Desktop (>= 768px): 4-5 columns, generous padding (md:p-5), smooth hover transitions.
 */
export default function Sponsors({ block }: BlockProps<"sponsors">) {
  const { title, sponsors } = block;

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  const groups = groupSponsorsByTier(sponsors);
  const hasMultipleTiers = groups.some((g) => g.tier !== null);

  return (
    <div className="flex flex-col gap-8 py-6 md:gap-10 md:py-8">
      {/* Block Heading */}
      {title ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-h2 font-bold text-foreground">
            {title}
          </h2>
          <div className="h-0.5 w-10 md:w-12 bg-accent" />
        </div>
      ) : null}

      <div className="flex flex-col gap-8 md:gap-10">
        {groups.map((group, groupIdx) => (
          <section
            key={group.tier ?? `untiered-${groupIdx}`}
            className="flex flex-col gap-3 md:gap-4"
          >
            {/* Tier Badge / Heading */}
            {hasMultipleTiers && group.tier ? (
              <div className="flex items-center gap-2.5 md:gap-3">
                <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-accent" />
                <h3 className="font-heading text-h3 font-semibold text-foreground">
                  {group.tier}
                </h3>
                <div className="h-px flex-1 bg-border/60" />
              </div>
            ) : null}

            {/* Grid of Sponsors: 2 cols on mobile, scales smoothly on larger screens */}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
              {group.items.map((sponsor, itemIdx) => (
                <li
                  key={`${group.tier ?? "all"}-${sponsor.name}-${itemIdx}`}
                  className="group relative flex flex-col items-center justify-between overflow-hidden rounded-[var(--radius-card)] bg-card-bg/70 p-3.5 sm:p-4 md:p-5 transition-all duration-300 active:scale-[0.98] hover:bg-card-bg md:hover:-translate-y-1"
                >
                  {/* Fixed-size logo area (aspect ratio box) so layout is consistent */}
                  <div className="flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-[var(--radius-card)] bg-background/50 p-2 transition-colors duration-300 group-hover:bg-background/80">
                    {sponsor.logo ? (
                      /* LOGO: image goes here */
                      <Media
                        src={sponsor.logo}
                        alt={sponsor.name}
                        width={240}
                        height={160}
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 45vw"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
                  </div>

                  {/* Sponsor name below */}
                  <span className="mt-2.5 text-center font-body text-body font-medium text-muted transition-colors duration-200 group-hover:text-foreground md:mt-3.5">
                    {sponsor.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

import Sponsors from "@/components/blocks/Sponsors";
import { lidoConnect } from "@/fixtures/shared";
import type { SponsorsBlock } from "@/types/api";

const sponsorsWithTiers: SponsorsBlock = {
  id: "partners-tiered",
  type: "sponsors",
  title: "Past partners",
  project_slug: null,
  tiers: [],
  sponsors: [
    {
      name: "TCOS Partner",
      logo: "/logo.png",
      tier: "Official Sponsor",
    },
    {
      name: "Lido Connect",
      logo: null,
      tier: "Official Sponsor",
    },
    {
      name: "Thai PBS",
      logo: null,
      tier: "Main Sponsor",
    },
    {
      name: "BACC",
      logo: null,
      tier: "Main Sponsor",
    },
    {
      name: "TK Park",
      logo: null,
      tier: "Co-Sponsor",
    },
  ],
};

const sponsorsHomeFixture: SponsorsBlock = {
  id: "partners-fixture",
  type: "sponsors",
  title: "Past partners",
  project_slug: null,
  tiers: [],
  sponsors: [lidoConnect],
};

export default function SponsorsPreviewPage() {
  return (
    <div className="flex flex-col gap-12 py-8">
      <Sponsors block={sponsorsWithTiers} />

      <hr className="border-border" />

      <Sponsors block={sponsorsHomeFixture} />
    </div>
  );
}

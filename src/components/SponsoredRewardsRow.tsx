import SponsoredBanner from "@/components/SponsoredBanner";
import { getActiveCampaigns, type SponsoredPlacement } from "@/lib/sponsoredCampaigns";

interface SponsoredRewardsRowProps {
  placement: SponsoredPlacement;
  title?: string;
  variant?: "card" | "compact" | "header";
  limit?: number;
  className?: string;
}

/**
 * Renders active sponsored campaigns for a given placement.
 * Renders nothing if no campaigns are active — fully optional.
 */
const SponsoredRewardsRow = ({
  placement,
  title = "Sponsored opportunities",
  variant = "card",
  limit,
  className = "",
}: SponsoredRewardsRowProps) => {
  const campaigns = getActiveCampaigns(placement);
  if (!campaigns.length) return null;
  const list = typeof limit === "number" ? campaigns.slice(0, limit) : campaigns;

  return (
    <section className={`mt-5 ${className}`} aria-label={title}>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div className="space-y-2">
        {list.map((c) => (
          <SponsoredBanner key={c.id} campaign={c} variant={variant} />
        ))}
      </div>
    </section>
  );
};

export default SponsoredRewardsRow;

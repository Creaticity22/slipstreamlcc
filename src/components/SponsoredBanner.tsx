import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SponsoredCampaign } from "@/lib/sponsoredCampaigns";

interface SponsoredBannerProps {
  campaign: SponsoredCampaign;
  variant?: "card" | "compact" | "header";
  className?: string;
}

/**
 * SponsoredBanner — Falcon-style sponsored content card.
 * - Always labelled "Sponsored"
 * - Always tied to a reward mechanic (bonus points, sponsored reward, mission, badge)
 * - Subtle, premium, dark-mode native — never popup, never autoplay
 */
const SponsoredBanner = ({ campaign, variant = "card", className = "" }: SponsoredBannerProps) => {
  const navigate = useNavigate();

  const handleCta = () => {
    if (!campaign.cta) return;
    if (campaign.cta.external) {
      window.open(campaign.cta.href, "_blank", "noopener,noreferrer");
    } else {
      navigate(campaign.cta.href);
    }
  };

  if (variant === "header") {
    return (
      <div
        className={`flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2 ${className}`}
      >
        <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={campaign.partnerLogo}
            alt={`${campaign.partnerName} logo`}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Sponsored · {campaign.partnerName}
          </p>
          <p className="text-xs font-medium text-foreground truncate">
            {campaign.rewardSummary}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleCta}
        className={`w-full text-left bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:shadow-elevated transition-all ${className}`}
      >
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={campaign.partnerLogo}
            alt={`${campaign.partnerName} logo`}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Sponsored · {campaign.partnerName}
          </p>
          <p className="text-sm font-semibold text-foreground truncate">{campaign.headline}</p>
        </div>
        {campaign.cta && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
    );
  }

  // Default: full card
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-card border border-border rounded-2xl overflow-hidden shadow-card ${className}`}
      aria-label={`Sponsored content from ${campaign.partnerName}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            Sponsored
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            with {campaign.partnerName}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1.5">
            <img
              src={campaign.partnerLogo}
              alt={`${campaign.partnerName} logo`}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-display font-semibold text-foreground leading-tight">
              {campaign.headline}
            </h3>
            {campaign.subline && (
              <p className="text-xs text-muted-foreground mt-1">{campaign.subline}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            {campaign.rewardSummary}
          </div>
          {campaign.cta && (
            <button
              onClick={handleCta}
              className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              {campaign.cta.label}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default SponsoredBanner;

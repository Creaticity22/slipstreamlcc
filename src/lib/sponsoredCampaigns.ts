// Sponsored Rewards — data-driven campaign registry
// Additive, non-intrusive partner content tied to learning, missions, and rewards.
// Rotate partners by editing this file (no redeploy logic required beyond a build).

import creaticityLogo from "@/assets/partners/creaticity.png";
import leedsCityCollegeLogo from "@/assets/partners/leeds-city-college.jpeg";

export type SponsoredPlacement =
  | "home"
  | "rewards"
  | "mission_header"
  | "badge_header";

export type SponsoredMechanic =
  | "bonus_points"
  | "sponsored_reward"
  | "sponsored_mission"
  | "sponsored_badge";

export interface SponsoredCampaign {
  id: string;
  partnerName: string;
  partnerLogo: string;
  headline: string;            // max 1 line
  subline?: string;            // optional supporting copy
  cta?: { label: string; href: string; external?: boolean };
  mechanic: SponsoredMechanic;
  rewardSummary: string;       // e.g. "Earn double points"
  placements: SponsoredPlacement[];
  startsAt: string;            // ISO date
  endsAt: string;              // ISO date
  accent?: "primary" | "warm" | "cool";
}

// Demo partner roster — Creaticity & Leeds City College.
export const SPONSORED_CAMPAIGNS: SponsoredCampaign[] = [
  {
    id: "creaticity-smart-saving",
    partnerName: "Creaticity",
    partnerLogo: creaticityLogo,
    headline: "Smart Saving Mission — earn double points",
    subline: "Crafting sustainable cities, one journey at a time.",
    cta: { label: "Start mission", href: "/learn" },
    mechanic: "sponsored_mission",
    rewardSummary: "2× points on this mission",
    placements: ["home", "mission_header"],
    startsAt: "2026-01-01",
    endsAt: "2026-12-31",
    accent: "warm",
  },
  {
    id: "lcc-confidence-badge",
    partnerName: "Leeds City College",
    partnerLogo: leedsCityCollegeLogo,
    headline: "“Travel Confidence” badge — supported by Leeds City College",
    subline: "Helping young people travel independently.",
    cta: { label: "View badge", href: "/points" },
    mechanic: "sponsored_badge",
    rewardSummary: "Unlock badge + 50 bonus points",
    placements: ["home", "badge_header", "rewards"],
    startsAt: "2026-01-01",
    endsAt: "2026-12-31",
    accent: "cool",
  },
  {
    id: "creaticity-voucher",
    partnerName: "Creaticity",
    partnerLogo: creaticityLogo,
    headline: "Redeem points for sustainable city vouchers",
    subline: "Sponsored reward in the marketplace.",
    cta: { label: "Browse rewards", href: "/points" },
    mechanic: "sponsored_reward",
    rewardSummary: "From 200 points",
    placements: ["rewards"],
    startsAt: "2026-01-01",
    endsAt: "2026-12-31",
    accent: "primary",
  },
];

export function getActiveCampaigns(
  placement: SponsoredPlacement,
  now: Date = new Date()
): SponsoredCampaign[] {
  const t = now.getTime();
  return SPONSORED_CAMPAIGNS.filter(
    (c) =>
      c.placements.includes(placement) &&
      new Date(c.startsAt).getTime() <= t &&
      new Date(c.endsAt).getTime() >= t
  );
}

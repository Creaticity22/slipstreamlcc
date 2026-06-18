export interface ChallengeDefinition {
  key: string;
  title: string;
  description: string;
  target: number;
  pointsReward: number;
  icon: string;
}

export const CHALLENGE_POOL: ChallengeDefinition[] = [
  { key: "trips_5",    title: "5 trips this week", description: "Complete 5 journeys",                target: 5, pointsReward: 50, icon: "Bus" },
  { key: "early_bird", title: "Early bird",        description: "Travel before 8:30am twice",         target: 2, pointsReward: 40, icon: "Sunrise" },
  { key: "new_route",  title: "Explorer",          description: "Try a destination you haven't used", target: 1, pointsReward: 60, icon: "Map" },
  { key: "co2_1kg",    title: "Green week",        description: "Save 1kg of CO₂ this week",          target: 1, pointsReward: 75, icon: "Leaf" },
  { key: "streak_3",   title: "3-day streak",      description: "Travel on 3 consecutive days",       target: 3, pointsReward: 45, icon: "Flame" },
];

export function pickWeeklyChallenges(userId: string, weekStart: string): ChallengeDefinition[] {
  let hash = 0;
  const seed = userId + weekStart;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const indices: number[] = [];
  for (let i = 0; i < 5; i++) indices.push((hash + i * 7) % CHALLENGE_POOL.length);
  return [...new Set(indices)].slice(0, 3).map((i) => CHALLENGE_POOL[i]);
}

export function getChallengeDefinition(key: string): ChallengeDefinition | undefined {
  return CHALLENGE_POOL.find((c) => c.key === key);
}

/** Current week's Monday in YYYY-MM-DD (local) */
export function currentWeekStart(d: Date = new Date()): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // back to Monday
  date.setDate(date.getDate() - diff);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

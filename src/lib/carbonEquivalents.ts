export interface CarbonEquivalent {
  emoji: string;
  label: string; // e.g. "charging your phone 45 times"
}

// Returns the most meaningful equivalent for a given kg of CO₂ saved
export function getCarbonEquivalent(co2Kg: number): CarbonEquivalent {
  const g = co2Kg * 1000; // grams

  if (g < 5) return { emoji: "💡", label: `leaving a light bulb on for ${Math.round(g * 1.2)} mins` };
  if (g < 20) return { emoji: "📱", label: `charging your phone ${Math.round(g / 8.22)} times` };
  if (g < 100) return { emoji: "🫙", label: `boiling a kettle ${Math.round(g / 30)} times` };
  if (g < 500) return { emoji: "🌳", label: `what a tree absorbs in ${Math.round(g / 21)} days` };
  if (g < 2000) return { emoji: "✈️", label: `${Math.round(g / 255)}% of a short-haul flight` };
  return { emoji: "🌍", label: `${(co2Kg / 2.3).toFixed(1)} days of average UK emissions` };
}

// Returns a short list of 2 equivalents for larger totals (used on history/impact screens)
export function getCarbonEquivalents(co2Kg: number): CarbonEquivalent[] {
  return [
    getCarbonEquivalent(co2Kg),
    co2Kg >= 0.1
      ? { emoji: "🌱", label: `${(co2Kg / 0.021).toFixed(0)} mins of tree growth` }
      : { emoji: "🚗", label: `saved vs ${((co2Kg / 0.21) * 1000).toFixed(0)}m by car` },
  ];
}

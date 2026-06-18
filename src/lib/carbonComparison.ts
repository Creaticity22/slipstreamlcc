// Average CO₂ per km by mode (kg)
const CO2_PER_KM = {
  car: 0.21, // average UK petrol car
  bus: 0.089,
  train: 0.035,
  walk: 0,
  cycle: 0,
};

export function getCarComparison(co2Kg: number, distanceKm: number): string | null {
  if (distanceKm <= 0) return null;
  const carCo2 = distanceKm * CO2_PER_KM.car;
  const saved = carCo2 - co2Kg;
  if (saved <= 0.001) return null;
  return `${saved.toFixed(2)} kg less CO₂ than driving`;
}

export function getTotalDistanceKm(legs: { distanceM: number }[]): number {
  return legs.reduce((sum, l) => sum + l.distanceM, 0) / 1000;
}

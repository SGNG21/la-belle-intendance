import { PRICING, sapActive } from "@/config/site";
import type { Frequency, HousingType } from "./lead";

export interface EstimateInput {
  housing: HousingType;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  frequency: Frequency;
}

export interface Estimate {
  hoursLow: number;
  hoursHigh: number;
  /** Prix TTC par intervention, seulement si un tarif horaire est configuré. */
  priceLow: number | null;
  priceHigh: number | null;
  /** Reste à charge après crédit d'impôt, seulement si la déclaration SAP est effective. */
  afterCreditLow: number | null;
  afterCreditHigh: number | null;
  label: string;
}

const halfHour = (h: number) => Math.max(1, Math.round(h * 2) / 2);

export function estimate(i: EstimateInput): Estimate {
  const p = PRICING.estimate;
  let h = i.surface / p.m2PerHour + i.bathrooms * p.perBathroomH + i.bedrooms * p.perBedroomH;
  if (i.housing === "grande-propriete") h *= p.grandePropriete;
  if (i.frequency === "ponctuel") h *= p.ponctuel;
  const low = halfHour(h * (1 - p.spreadPct));
  const high = Math.max(low, halfHour(h * (1 + p.spreadPct)));

  const rate = PRICING.hourlyTTC;
  const priceLow = rate ? Math.round(low * rate) : null;
  const priceHigh = rate ? Math.round(high * rate) : null;
  const credit = sapActive() && rate;
  return {
    hoursLow: low,
    hoursHigh: high,
    priceLow,
    priceHigh,
    afterCreditLow: credit && priceLow != null ? Math.round(priceLow / 2) : null,
    afterCreditHigh: credit && priceHigh != null ? Math.round(priceHigh / 2) : null,
    label: i.frequency === "ponctuel" ? "pour un grand ménage" : "par passage",
  };
}

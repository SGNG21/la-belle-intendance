"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { estimate } from "@/lib/estimate";
import { FREQUENCIES, FREQUENCY_LABEL, HOUSING_LABEL, HOUSING_TYPES, type Frequency, type HousingType } from "@/lib/lead";
import { track } from "@/lib/track";

const eur = (n: number) => `${n.toLocaleString("fr-FR")} €`;
const hours = (h: number) => `${h.toLocaleString("fr-FR")} h`;

export function Simulator({ hourlyKnown }: { hourlyKnown: boolean }) {
  const uid = useId();
  const [housing, setHousing] = useState<HousingType>("maison");
  const [surface, setSurface] = useState(120);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(1);
  const [frequency, setFrequency] = useState<Frequency>("hebdomadaire");

  const e = estimate({ housing, surface, bedrooms, bathrooms, frequency });
  const query = new URLSearchParams({ housing, surface: String(surface), bedrooms: String(bedrooms), bathrooms: String(bathrooms), frequency }).toString();

  const clamp = (v: string, min: number, max: number, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };

  return (
    <div className="sim">
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
        <legend className="label">Type de logement</legend>
        <div className="choices">
          {HOUSING_TYPES.map((h) => (
            <label className="choice" key={h}>
              <input type="radio" name={`${uid}-housing`} checked={housing === h} onChange={() => setHousing(h)} />
              <span>{HOUSING_LABEL[h]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="row-2 row-3">
        <div className="field">
          <label htmlFor={`${uid}-s`}>Surface (m²)</label>
          <input id={`${uid}-s`} className="input" inputMode="numeric" value={surface} onChange={(ev) => setSurface(clamp(ev.target.value, 20, 1000, 120))} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-b`}>Chambres</label>
          <input id={`${uid}-b`} className="input" inputMode="numeric" value={bedrooms} onChange={(ev) => setBedrooms(clamp(ev.target.value, 0, 20, 3))} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-sb`}>Salles de bains</label>
          <input id={`${uid}-sb`} className="input" inputMode="numeric" value={bathrooms} onChange={(ev) => setBathrooms(clamp(ev.target.value, 0, 10, 1))} />
        </div>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
        <legend className="label">Fréquence</legend>
        <div className="choices">
          {FREQUENCIES.filter((f) => f !== "autre").map((f) => (
            <label className="choice" key={f}>
              <input type="radio" name={`${uid}-freq`} checked={frequency === f} onChange={() => setFrequency(f)} />
              <span>{FREQUENCY_LABEL[f]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="sim-result" aria-live="polite">
        <p className="muted">Durée indicative {e.label}</p>
        <p className="sim-figure">
          {e.hoursLow === e.hoursHigh ? hours(e.hoursLow) : `${hours(e.hoursLow)} à ${hours(e.hoursHigh)}`}
        </p>
        {hourlyKnown && e.priceLow != null && e.priceHigh != null ? (
          <p>
            Soit environ <strong>{eur(e.priceLow)} à {eur(e.priceHigh)}</strong> TTC.
          </p>
        ) : (
          <p>Le tarif est indiqué dans votre devis écrit, selon la prestation et la distance.</p>
        )}
        <p className="hint">Ordre de grandeur, sans engagement. La durée réelle dépend de l'état du logement et de vos priorités.</p>
        <div className="btn-row" style={{ marginTop: "0.5rem" }}>
          <Link className="btn" href={`/contact?${query}#formulaire`} onClick={() => track("simulator_to_quote", { housing, surface })}>
            Demander un devis pour ce logement
          </Link>
        </div>
      </div>
    </div>
  );
}

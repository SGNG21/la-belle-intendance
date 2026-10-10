"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COMMUNES } from "@/config/site";
import {
  FREQUENCIES,
  FREQUENCY_LABEL,
  HOUSING_LABEL,
  HOUSING_TYPES,
  validateLead,
  type ClientType,
  type FieldErrors,
  type Frequency,
  type HousingType,
  type LeadInput,
} from "@/lib/lead";
import { track } from "@/lib/track";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok" } | { kind: "error"; message: string };

const num = (v: string): number | undefined => {
  if (v.trim() === "") return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/**
 * `redirectTo` : page de confirmation vers laquelle rediriger après envoi.
 * Sans elle, le formulaire affiche sa confirmation sur place — c'est le
 * comportement de la page Contact. Les pages de destination préfèrent une
 * URL dédiée, mesurable comme conversion.
 */
export function LeadForm({ defaultClientType = "particulier", redirectTo }: { defaultClientType?: ClientType; redirectTo?: string }) {
  const router = useRouter();
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const startedAt = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  const [clientType, setClientType] = useState<ClientType>(defaultClientType);
  const [housing, setHousing] = useState<HousingType | "">("");
  const [surface, setSurface] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [frequency, setFrequency] = useState<Frequency | "">("");
  const [commune, setCommune] = useState("");
  const [needs, setNeeds] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [utm, setUtm] = useState<Record<string, string>>({});

  // Préremplissage par paramètres d'URL (?surface=&housing=&bedrooms=&bathrooms=&frequency=) et capture des UTM.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const h = q.get("housing");
    if (h && (HOUSING_TYPES as readonly string[]).includes(h)) setHousing(h as HousingType);
    const f = q.get("frequency");
    if (f && (FREQUENCIES as readonly string[]).includes(f)) setFrequency(f as Frequency);
    const s = q.get("surface");
    if (s && /^\d{2,4}$/.test(s)) setSurface(s);
    const b = q.get("bedrooms");
    if (b && /^\d{1,2}$/.test(b)) setBedrooms(b);
    const ba = q.get("bathrooms");
    if (ba && /^\d{1,2}$/.test(ba)) setBathrooms(ba);
    if (q.get("type") === "professionnel") setClientType("professionnel");
    const found: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid"].forEach((k) => {
      const v = q.get(k);
      if (v) found[k] = v.slice(0, 120);
    });
    setUtm(found);
  }, []);

  const draft: Partial<LeadInput> = useMemo(
    () => ({
      clientType,
      housing: clientType === "particulier" ? (housing || undefined) : undefined,
      surface: num(surface),
      bedrooms: num(bedrooms),
      bathrooms: num(bathrooms),
      frequency: frequency || undefined,
      commune,
      needs,
      name,
      phone,
      email,
      consent,
    }),
    [clientType, housing, surface, bedrooms, bathrooms, frequency, commune, needs, name, phone, email, consent],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "sending") return;
    const found = validateLead(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus({ kind: "error", message: "Vérifiez les champs signalés, puis envoyez à nouveau." });
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, website, startedAt: startedAt.current, page: window.location.pathname, utm }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: FieldErrors; error?: string };
      if (res.ok && data.ok) {
        if (redirectTo) {
          // La conversion est déclenchée par la page d'arrivée : un seul endroit
          // qui compte, qu'on arrive du formulaire ou qu'on recharge la page.
          setStatus({ kind: "sending" });
          router.push(redirectTo);
          return;
        }
        track("generate_lead", { client_type: clientType, frequency: frequency || "n/a" });
        setStatus({ kind: "ok" });
        return;
      }
      if (res.status === 422 && data.errors) setErrors(data.errors);
      setStatus({ kind: "error", message: data.error ?? "L'envoi a échoué. Réessayez dans un instant ou contactez-nous directement." });
    } catch {
      setStatus({ kind: "error", message: "Connexion impossible. Vérifiez votre réseau et réessayez." });
    }
  }

  if (status.kind === "ok") {
    return (
      <div className="form-status form-status--ok" role="status">
        <h3>Demande bien reçue</h3>
        <p style={{ marginTop: "0.5rem" }}>Merci {name.split(" ")[0]}. Nous vous rappelons pour préciser votre besoin, puis nous vous envoyons un devis écrit.</p>
      </div>
    );
  }

  const err = (k: keyof LeadInput) => (errors[k] ? <p className="error" id={id(`${k}-err`)}>{errors[k]}</p> : null);
  const aria = (k: keyof LeadInput) => ({ "aria-invalid": errors[k] ? (true as const) : undefined, "aria-describedby": errors[k] ? id(`${k}-err`) : undefined });

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate>
      <fieldset>
        <legend>Vous êtes</legend>
        <div className="choices" role="radiogroup" aria-label="Type de client">
          {(["particulier", "professionnel"] as const).map((t) => (
            <label className="choice" key={t}>
              <input type="radio" name="clientType" value={t} checked={clientType === t} onChange={() => setClientType(t)} />
              <span>{t === "particulier" ? "Particulier" : "Professionnel"}</span>
            </label>
          ))}
        </div>
        {err("clientType")}
      </fieldset>

      {clientType === "particulier" ? (
        <fieldset>
          <legend>Votre logement</legend>
          <div className="choices" role="radiogroup" aria-label="Type de logement">
            {HOUSING_TYPES.map((h) => (
              <label className="choice" key={h}>
                <input type="radio" name="housing" value={h} checked={housing === h} onChange={() => setHousing(h)} />
                <span>{HOUSING_LABEL[h]}</span>
              </label>
            ))}
          </div>
          {err("housing")}
        </fieldset>
      ) : null}

      <fieldset>
        <legend>{clientType === "particulier" ? "Sa taille" : "Vos locaux"}</legend>
        <div className="row-2 row-3">
          <div className="field">
            <label htmlFor={id("surface")}>Surface (m²)</label>
            <input id={id("surface")} className="input" inputMode="numeric" value={surface} onChange={(e) => setSurface(e.target.value)} {...aria("surface")} />
            {err("surface")}
          </div>
          {clientType === "particulier" ? (
            <>
              <div className="field">
                <label htmlFor={id("bedrooms")}>Chambres</label>
                <input id={id("bedrooms")} className="input" inputMode="numeric" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} {...aria("bedrooms")} />
                {err("bedrooms")}
              </div>
              <div className="field">
                <label htmlFor={id("bathrooms")}>Salles de bains</label>
                <input id={id("bathrooms")} className="input" inputMode="numeric" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} {...aria("bathrooms")} />
                {err("bathrooms")}
              </div>
            </>
          ) : null}
        </div>
      </fieldset>

      <fieldset>
        <legend>Fréquence souhaitée</legend>
        <div className="choices" role="radiogroup" aria-label="Fréquence">
          {FREQUENCIES.map((f) => (
            <label className="choice" key={f}>
              <input type="radio" name="frequency" value={f} checked={frequency === f} onChange={() => setFrequency(f)} />
              <span>{FREQUENCY_LABEL[f]}</span>
            </label>
          ))}
        </div>
        {err("frequency")}
      </fieldset>

      <div className="field">
        <label htmlFor={id("commune")}>Commune</label>
        <input id={id("commune")} className="input" list={id("communes")} autoComplete="address-level2" value={commune} onChange={(e) => setCommune(e.target.value)} {...aria("commune")} />
        <datalist id={id("communes")}>
          {COMMUNES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {err("commune")}
      </div>

      <div className="field">
        <label htmlFor={id("needs")}>Précisions (facultatif)</label>
        <textarea id={id("needs")} className="textarea" value={needs} onChange={(e) => setNeeds(e.target.value)} placeholder="Accès, animaux, pièces à privilégier, date souhaitée…" {...aria("needs")} />
        {err("needs")}
      </div>

      <fieldset>
        <legend>Pour vous répondre</legend>
        <div className="field">
          <label htmlFor={id("name")}>Nom</label>
          <input id={id("name")} className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} {...aria("name")} />
          {err("name")}
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor={id("phone")}>Téléphone</label>
            <input id={id("phone")} className="input" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} {...aria("phone")} />
            {err("phone")}
          </div>
          <div className="field">
            <label htmlFor={id("email")}>E-mail</label>
            <input id={id("email")} className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...aria("email")} />
            {err("email")}
          </div>
        </div>
      </fieldset>

      {/* Champ piège : invisible pour une personne, rempli par les robots. */}
      <div className="trap" aria-hidden="true">
        <label htmlFor={id("website")}>Ne pas remplir</label>
        <input id={id("website")} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="field">
        <label className="consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} {...aria("consent")} />
          <span>
            J'accepte que mes informations soient utilisées pour répondre à ma demande de devis. Elles ne sont ni revendues ni utilisées pour autre chose. <Link href="/confidentialite">Mes droits et la durée de conservation</Link>.
          </span>
        </label>
        {err("consent")}
      </div>

      {status.kind === "error" ? (
        <p className="form-status form-status--err" role="alert">
          {status.message}
        </p>
      ) : null}

      <div>
        <button className="btn" type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Envoi en cours" : "Envoyer ma demande"}
        </button>
      </div>
    </form>
  );
}

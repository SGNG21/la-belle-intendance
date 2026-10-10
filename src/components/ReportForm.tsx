"use client";

import { useEffect, useId, useState } from "react";
import { PIECES, validateReport, type ReportErrors, type ReportInput } from "@/lib/report";
import type { Bien, Client } from "@/lib/crmModel";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok" } | { kind: "error"; message: string };
type Room = { label: string; detail: string; on: boolean };
type Photo = { name: string; dataUrl: string };

const today = () => new Date().toISOString().slice(0, 10);
const initialRooms = (): Room[] => PIECES.map((label) => ({ label, detail: "", on: false }));

/**
 * Réduction des photos dans le navigateur avant l'envoi.
 *
 * Une photo de téléphone pèse 3 à 5 Mo ; quatre d'un coup dépasseraient la
 * limite du serveur et de Resend, et prendraient une éternité en 4G au fond
 * d'une maison de campagne. 1 400 px suffisent largement pour un e-mail.
 */
async function shrink(file: File): Promise<Photo> {
  const bitmap = await createImageBitmap(file);
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return { name: file.name.replace(/\.[^.]+$/, "") + ".jpg", dataUrl: canvas.toDataURL("image/jpeg", 0.82) };
}

export function ReportForm() {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [property, setProperty] = useState("");
  const [date, setDate] = useState(today);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [alert, setAlert] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<ReportErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fiche, setFiche] = useState<string | null>(null);
  const [lien, setLien] = useState<{ clientId?: string; bienId: string } | null>(null);

  /**
   * Arrivée depuis la fiche d'un bien : « /intendance/compte-rendu?bien=… ».
   *
   * Le formulaire se règle sur ce bien — le client, son adresse, et la liste
   * des prestations retenues, déjà cochées avec leur consigne. Les pièces non
   * retenues restent proposées en dessous : un passage peut sortir du cadre.
   */
  useEffect(() => {
    const bienId = new URLSearchParams(window.location.search).get("bien");
    if (!bienId || !/^[0-9a-f-]{36}$/i.test(bienId)) return;
    let annule = false;
    fetch(`/api/intendance/biens/${bienId}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ bien: Bien; client: Pick<Client, "id" | "nom" | "email"> | null }>) : null))
      .then((d) => {
        if (annule || !d?.bien) return;
        const { bien, client } = d;
        setClientName(client?.nom ?? "");
        setClientEmail(client?.email ?? "");
        setProperty([bien.libelle, bien.commune].filter(Boolean).join(", "));
        const retenues = bien.prestations ?? [];
        setRooms([
          ...retenues.map((p) => ({ label: p.label, detail: p.detail ?? "", on: true })),
          ...PIECES.filter((l) => !retenues.some((p) => p.label === l)).map((label) => ({ label, detail: "", on: false })),
        ]);
        setFiche(bien.libelle);
        setLien({ bienId: bien.id, ...(client ? { clientId: client.id } : {}) });
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, []);

  const toggle = (i: number) => setRooms((r) => r.map((x, n) => (n === i ? { ...x, on: !x.on } : x)));
  const detail = (i: number, v: string) => setRooms((r) => r.map((x, n) => (n === i ? { ...x, detail: v } : x)));

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const next = [...photos];
      for (const f of Array.from(files).slice(0, 4 - photos.length)) next.push(await shrink(f));
      setPhotos(next);
    } catch {
      setStatus({ kind: "error", message: "Une photo n'a pas pu être lue. Réessayez." });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const draft: Partial<ReportInput> = {
      clientName, clientEmail, property, date,
      rooms: rooms.filter((r) => r.on).map(({ label, detail }) => ({ label, detail })),
      alert, photos,
    };
    const found = validateReport(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus({ kind: "error", message: "Vérifiez les champs signalés." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/compte-rendu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ...(lien ?? {}) }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: ReportErrors; error?: string };
      if (res.ok && data.ok) {
        setStatus({ kind: "ok" });
        return;
      }
      if (data.errors) setErrors(data.errors);
      setStatus({ kind: "error", message: data.error ?? "L'envoi a échoué." });
    } catch {
      setStatus({ kind: "error", message: "Connexion impossible. Réessayez une fois le réseau revenu." });
    }
  }

  function reset() {
    setClientName(""); setClientEmail(""); setProperty(""); setDate(today());
    setRooms(initialRooms()); setAlert(""); setPhotos([]); setErrors({}); setStatus({ kind: "idle" }); setFiche(null); setLien(null);
  }

  if (status.kind === "ok") {
    return (
      <div className="form-status form-status--ok" role="status">
        <h3>Compte rendu envoyé</h3>
        <p style={{ marginTop: "0.5rem" }}>
          {clientName} l&apos;a reçu, et une copie est arrivée dans la boîte de l&apos;entreprise.
        </p>
        <div className="btn-row" style={{ marginTop: "1.4rem" }}>
          <button type="button" className="btn" onClick={reset}>
            Un autre passage
          </button>
        </div>
      </div>
    );
  }

  const err = (k: keyof ReportInput) => (errors[k] ? <p className="error">{errors[k]}</p> : null);

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {fiche ? <p className="cr-fiche">Prérempli depuis la fiche : <strong>{fiche}</strong></p> : null}
      <fieldset>
        <legend>La maison</legend>
        <div className="field">
          <label htmlFor={id("cn")}>Nom du client</label>
          <input id={id("cn")} className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} autoComplete="off" />
          {err("clientName")}
        </div>
        <div className="field">
          <label htmlFor={id("ce")}>Son e-mail</label>
          <input id={id("ce")} className="input" type="email" inputMode="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} autoComplete="off" />
          {err("clientEmail")}
        </div>
        <div className="field">
          <label htmlFor={id("pr")}>Le bien</label>
          <input id={id("pr")} className="input" value={property} onChange={(e) => setProperty(e.target.value)} placeholder="Maison de caractère, 6 pièces" autoComplete="off" />
          {err("property")}
        </div>
        <div className="field">
          <label htmlFor={id("dt")}>Date du passage</label>
          <input id={id("dt")} className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {err("date")}
        </div>
      </fieldset>

      <fieldset>
        <legend>Ce qui a été fait</legend>
        {err("rooms")}
        <div className="cr-rooms">
          {rooms.map((r, i) => (
            <div key={r.label} className={`cr-room${r.on ? " is-on" : ""}`}>
              <label className="cr-check">
                <input type="checkbox" checked={r.on} onChange={() => toggle(i)} />
                <span>{r.label}</span>
              </label>
              {r.on ? (
                <input
                  className="cr-detail"
                  value={r.detail}
                  onChange={(e) => detail(i, e.target.value)}
                  placeholder="Plan de travail, plaques, évier, sol"
                  aria-label={`Détail pour ${r.label}`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>À signaler</legend>
        <div className="field">
          <label htmlFor={id("al")}>
            Ce qui mérite son attention <span className="muted">(facultatif)</span>
          </label>
          <textarea id={id("al")} className="textarea" rows={3} value={alert} onChange={(e) => setAlert(e.target.value)} placeholder="Légère trace d'humidité au plafond de la buanderie, photo jointe." />
          {err("alert")}
        </div>
        <div className="field">
          <label htmlFor={id("ph")}>Photos <span className="muted">(4 au maximum)</span></label>
          <input id={id("ph")} className="input" type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} disabled={busy || photos.length >= 4} />
          {busy ? <p className="hint">Réduction des photos…</p> : null}
          {photos.length ? (
            <div className="cr-photos">
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <figure key={p.name + i}>
                  <img src={p.dataUrl} alt="" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, n) => n !== i))} aria-label={`Retirer la photo ${i + 1}`}>
                    Retirer
                  </button>
                </figure>
              ))}
            </div>
          ) : null}
          {err("photos")}
        </div>
      </fieldset>

      {status.kind === "error" ? <p className="form-status form-status--err" role="alert">{status.message}</p> : null}

      <div className="btn-row">
        <button className="btn" type="submit" disabled={status.kind === "sending" || busy}>
          {status.kind === "sending" ? "Envoi…" : "Envoyer le compte rendu"}
        </button>
      </div>
    </form>
  );
}

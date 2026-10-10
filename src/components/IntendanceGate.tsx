"use client";

import { useEffect, useState } from "react";
import { Seal } from "./Icons";

type State = "checking" | "locked" | "open" | "unconfigured";

/**
 * Écran de verrouillage de l'outil interne.
 *
 * Le contenu n'apparaît qu'une fois la session ouverte. Le mot de passe n'est
 * jamais conservé par le navigateur : le serveur dépose un cookie httpOnly,
 * valable trente jours, qu'aucun script ne peut lire.
 */
export function IntendanceGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/intendance/session", { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ status: r.status, d })))
      .then(({ status, d }) => {
        if (cancelled) return;
        if (status === 503 || d?.configured === false) setState("unconfigured");
        else setState(d?.ok ? "open" : "locked");
      })
      .catch(() => !cancelled && setState("locked"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/intendance/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && d.ok) {
        setCode("");
        setState("open");
        return;
      }
      setError(d.error ?? "Connexion impossible.");
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="gate" aria-busy="true">
        <p className="gate-wait">Un instant…</p>
      </div>
    );
  }

  if (state === "unconfigured") {
    return (
      <div className="gate">
        <div className="gate-card">
          <h1>Accès non configuré</h1>
          <p>Le mot de passe de l&apos;outil n&apos;a pas été défini sur le serveur. Cette page ne peut pas être utilisée pour le moment.</p>
        </div>
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="gate">
        <form className="gate-card" onSubmit={submit}>
          <span className="gate-seal">
            <Seal />
          </span>
          <h1>Accès réservé</h1>
          <p>Cet espace est réservé à La Belle Intendance.</p>
          <div className="field" style={{ marginTop: "1.6rem", textAlign: "left" }}>
            <label htmlFor="gate-code">Mot de passe</label>
            <input
              id="gate-code"
              className="input"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          {error ? (
            <p className="error" role="alert" style={{ textAlign: "left" }}>
              {error}
            </p>
          ) : null}
          <button className="btn" type="submit" disabled={busy} style={{ marginTop: "1.2rem", width: "100%" }}>
            {busy ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {children}
      <div className="gate-out">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/intendance/session", { method: "DELETE" }).catch(() => {});
            setState("locked");
          }}
        >
          Fermer la session
        </button>
      </div>
    </>
  );
}

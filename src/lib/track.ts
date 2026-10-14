/**
 * Événements de conversion.
 *
 * N'envoie rien sans consentement : ni gtag ni fbq n'existent avant que le
 * visiteur ait répondu à la bannière. Les noms d'événements de Meta diffèrent
 * de ceux de Google, d'où la table de correspondance.
 */
type Fonction = (...args: unknown[]) => void;

const META: Record<string, string> = { generate_lead: "Lead", contact: "Contact" };

export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Fonction; fbq?: Fonction };
  if (typeof w.gtag === "function") w.gtag("event", event, params);
  if (typeof w.fbq === "function" && META[event]) w.fbq("track", META[event], params);
}

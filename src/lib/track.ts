/** Événements de conversion. N'envoie rien sans consentement : gtag n'existe qu'après acceptation. */
type Gtag = (...args: unknown[]) => void;

export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof g === "function") g("event", event, params);
}

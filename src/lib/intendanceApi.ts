/** Appels du back-office depuis le navigateur. Une erreur remonte un message lisible. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...(init?.headers ?? {}) } : init?.headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T;
  if (!res.ok || data.ok === false || data.error) {
    throw new Error(data.error ?? (res.status === 401 ? "Session fermée, rechargez la page." : "Opération impossible."));
  }
  return data;
}

/** « 10 oct. », ou « 10 oct. 2025 » si l'année n'est pas la bonne. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

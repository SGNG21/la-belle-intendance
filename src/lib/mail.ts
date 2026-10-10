import { CONTACT, SITE } from "@/config/site";

/**
 * L'envoi des e-mails, en un seul endroit.
 *
 * Tout ce qui part de l'entreprise part de la même adresse : celle que le
 * client connaît, contact@… Un devis qui arriverait d'un « site@ » ou d'un
 * « no-reply@ » n'aurait pas l'air d'avoir été écrit par quelqu'un.
 *
 * MAIL_FROM permet de pointer ailleurs sans toucher au code ; sans elle, on
 * prend l'adresse de contact du site, et en dernier recours LEAD_EMAIL_FROM.
 * Le domaine utilisé doit être vérifié chez Resend, sinon l'envoi est refusé.
 */
export function expediteur(): string | null {
  const brut =
    (process.env.MAIL_FROM ?? "").trim() ||
    (CONTACT.email ?? "").trim() ||
    (process.env.LEAD_EMAIL_FROM ?? "").trim();
  if (!brut) return null;
  // Sans nom affiché, la messagerie montre l'adresse brute : plus technique,
  // moins engageant.
  return brut.includes("<") ? brut : `${SITE.name} <${brut}>`;
}

/** L'envoi est-il configuré de bout en bout ? */
export const envoiPret = () => Boolean(process.env.RESEND_API_KEY && expediteur());

export interface PieceJointe {
  filename: string;
  /** Contenu en base64, sans le préfixe « data: ». */
  content: string;
  content_id?: string;
}

export interface Courriel {
  to: string[];
  subject: string;
  text: string;
  html: string;
  /** Adresse de réponse, quand elle diffère de l'expéditeur. */
  replyTo?: string | null;
  attachments?: PieceJointe[];
}

/**
 * Envoie le message. Lève une erreur si l'envoi n'est pas configuré ou si
 * Resend refuse — l'appelant décide quoi en dire.
 */
export async function envoyer(c: Courriel, ms = 15000): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = expediteur();
  if (!key || !from) throw new Error("envoi non configuré");

  const destinataires = c.to.map((a) => a.trim()).filter(Boolean);
  if (!destinataires.length) throw new Error("aucun destinataire");

  const reply = c.replyTo?.trim();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: destinataires,
        // Inutile de répéter l'expéditeur : la réponse y va déjà.
        ...(reply && !from.includes(reply) ? { reply_to: reply } : {}),
        subject: c.subject,
        text: c.text,
        html: c.html,
        ...(c.attachments?.length ? { attachments: c.attachments } : {}),
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`resend ${res.status} ${await res.text().catch(() => "")}`.trim());
}

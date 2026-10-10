import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Session de l'outil interne.
 *
 * Le navigateur ne garde jamais le mot de passe : à l'ouverture d'une session,
 * le serveur dépose un cookie httpOnly contenant l'empreinte du code. Un script
 * ne peut pas le lire, et le cookie volé ne révèle pas le code lui-même.
 */

export const SESSION_COOKIE = "lbi_intendance";
/** Trente jours : Coralie ne retape pas son mot de passe à chaque passage. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Comparaison à durée constante : un secret ne doit pas se deviner au chronomètre. */
function same(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function codeIsValid(code: string, expected: string): boolean {
  return same(digest(code), digest(expected));
}

export function sessionToken(expected: string): string {
  return digest(expected).toString("hex");
}

export function tokenIsValid(token: string | undefined, expected: string): boolean {
  if (!token) return false;
  let given: Buffer;
  try {
    given = Buffer.from(token, "hex");
  } catch {
    return false;
  }
  return same(given, digest(expected));
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

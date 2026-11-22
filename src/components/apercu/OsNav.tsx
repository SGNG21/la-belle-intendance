"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * La navigation de l'outil.
 *
 * Cinq entrées, pas six : au-delà, la barre basse d'un téléphone devient une
 * rangée de cibles trop étroites pour un pouce. Tout le reste vit dans Réglages
 * ou s'atteint depuis une fiche.
 */

/**
 * La navigation sert deux espaces : la maquette sous /intendance/apercu et
 * l'outil réel sous /intendance. Les entrées sont les mêmes, seule la racine
 * change — un seul composant plutôt que deux qui divergeraient.
 */
const entrees = (RACINE: string) => [
  { href: RACINE, label: "Aujourd'hui", d: "M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5" },
  { href: `${RACINE}/clients`, label: "Clients", d: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 19v-1a4 4 0 0 0-3-3.9" },
  { href: `${RACINE}/agenda`, label: "Agenda", d: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" },
  { href: `${RACINE}/documents`, label: "Documents", d: "M6 3h7l5 5v13H6zM13 3v5h5M9 13h6M9 17h6" },
  { href: `${RACINE}/reglages`, label: "Réglages", d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.6V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.5 1.5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1" },
];

export function OsNav({ racine = "/intendance/apercu" }: { racine?: string }) {
  const ici = usePathname();
  const RACINE = racine;
  const ENTREES = entrees(RACINE);

  return (
    <nav className="os-nav" aria-label="Navigation de l'outil">
      <p className="os-nav__brand">
        La Belle Intendance
        <span>{racine.endsWith("apercu") ? "Aperçu" : "Le bureau"}</span>
      </p>
      {ENTREES.map((e) => {
        // « Aujourd'hui » est la racine : sans l'égalité stricte, il resterait
        // actif sur toutes les sous-pages.
        const actif = e.href === RACINE ? ici === RACINE : ici.startsWith(e.href);
        return (
          <Link key={e.href} href={e.href} className="os-nav__link" aria-current={actif ? "page" : undefined}>
            <svg className="os-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d={e.d} />
            </svg>
            {e.label}
          </Link>
        );
      })}
    </nav>
  );
}

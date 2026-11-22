import Link from "next/link";

/** Les briques communes aux écrans de la maquette. */

export function Tag({ ton, children }: { ton: "attente" | "cours" | "fait" | "sceau" | "alerte"; children: React.ReactNode }) {
  // Le glyphe double la couleur : lisible en noir et blanc, et pour un daltonien.
  const glyphe = { attente: "○", cours: "●", fait: "✓", sceau: "❖", alerte: "▲" }[ton];
  return (
    <span className={`os-tag os-tag--${ton}`} data-glyphe={glyphe}>
      {children}
    </span>
  );
}

export function Carte({ titre, action, children, className = "" }: { titre?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`os-card ${className}`.trim()}>
      {titre && (
        <div className="os-card__head">
          <h2 className="os-card__title">{titre}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ k, v, n }: { k: string; v: string; n?: string }) {
  return (
    <div className="os-stat">
      <span className="os-stat__k">{k}</span>
      <span className="os-stat__v">{v}</span>
      {n && <span className="os-stat__n">{n}</span>}
    </div>
  );
}

export function Champ({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function Entete({ kicker, titre, sous, action }: { kicker?: string; titre: string; sous?: string; action?: React.ReactNode }) {
  return (
    <header className="os-head">
      <div>
        {kicker && <p className="os-kicker">{kicker}</p>}
        <h1 className="os-h1">{titre}</h1>
        {sous && <p className="os-sub">{sous}</p>}
      </div>
      {action}
    </header>
  );
}

/** Rappel permanent : ce qu'on regarde n'est pas l'outil réel. */
export function Bandeau({ children }: { children: React.ReactNode }) {
  return <p className="os-demo">◆ {children}</p>;
}

export function Lien({ href, children, variante = "contour" }: { href: string; children: React.ReactNode; variante?: "plein" | "contour" | "nu" }) {
  return (
    <Link href={href} className={`os-btn os-btn--${variante}`}>
      {children}
    </Link>
  );
}

/**
 * Une action que la maquette ne peut pas exécuter, ou qu'un verrou interdit.
 *
 * On affiche toujours le bouton et toujours la raison : un bouton qui
 * disparaît laisse l'utilisateur chercher ce qu'il a mal fait.
 */
export function Bloque({ children, raison }: { children: React.ReactNode; raison: string }) {
  return (
    <>
      <span className="os-btn os-btn--plein" aria-disabled="true">
        {children}
      </span>
      <span className="os-why">{raison}</span>
    </>
  );
}

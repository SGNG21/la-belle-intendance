import Image from "next/image";

/**
 * Image d'illustration.
 *
 * Toutes les images du site sont des vues d'ambiance générées par intelligence
 * artificielle (voir /mentions-legales). Aucune ne montre un chantier réalisé,
 * un logement de client ni un avant/après : le texte alternatif et la légende
 * décrivent une scène, ils n'affirment jamais une intervention.
 */
export function Figure({
  src,
  alt,
  caption,
  priority = false,
  sizes = "(max-width: 900px) 100vw, 50vw",
}: {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <figure className="figure">
      <Image src={src} alt={alt} width={1536} height={1024} sizes={sizes} priority={priority} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** Bandeau pleine largeur. Même règle : une ambiance, pas une preuve. */
export function Band({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="band" aria-hidden={false}>
      <Image src={src} alt={alt} width={1536} height={1024} sizes="100vw" priority={priority} />
    </div>
  );
}

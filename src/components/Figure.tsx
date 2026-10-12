import Image from "next/image";

/**
 * Image d'illustration.
 *
 * Le site mêle des vues d'ambiance générées par intelligence artificielle et
 * des photographies réelles (voir /mentions-legales). Dans les deux cas la
 * règle est la même : aucune ne montre un avant/après ni ne sert de preuve.
 * Le texte alternatif et la légende décrivent une scène, ils n'affirment
 * jamais une intervention.
 *
 * `width` et `height` sont les dimensions réelles du fichier : s'en écarter
 * ferait sauter la page au chargement de l'image.
 */
export function Figure({
  src,
  alt,
  caption,
  priority = false,
  sizes = "(max-width: 900px) 100vw, 50vw",
  width = 1536,
  height = 1024,
}: {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="figure">
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} />
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

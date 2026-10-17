import type { Metadata } from "next";
import { SITE } from "@/config/site";

/**
 * Métadonnées d'une page du site.
 *
 * L'image Open Graph est déclarée explicitement. Next l'ajoute tout seul
 * depuis `opengraph-image.tsx` — mais seulement tant qu'une page ne définit
 * pas son propre bloc `openGraph`, qui remplace alors celui du parent, image
 * comprise. Toutes les pages passant par ici en définissaient un : aucune
 * n'avait d'image, et un lien partagé sur Facebook s'affichait tout nu.
 */
const IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name} — ${SITE.tagline}`,
};

export function pageMeta(o: { title: string; description: string; path: string }): Metadata {
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: {
      title: `${o.title} | ${SITE.name}`,
      description: o.description,
      url: `${SITE.url}${o.path}`,
      siteName: SITE.name,
      locale: "fr_FR",
      type: "website",
      images: [IMAGE],
    },
    twitter: { card: "summary_large_image", title: `${o.title} | ${SITE.name}`, description: o.description, images: [IMAGE.url] },
  };
}

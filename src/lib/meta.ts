import type { Metadata } from "next";
import { SITE } from "@/config/site";

export function pageMeta(o: { title: string; description: string; path: string }): Metadata {
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: { title: `${o.title} | ${SITE.name}`, description: o.description, url: `${SITE.url}${o.path}`, siteName: SITE.name, locale: "fr_FR", type: "website" },
  };
}

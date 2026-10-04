import { COMMUNES, CONTACT, FOUNDER, LEGAL, SERVICES, SITE, sapActive } from "@/config/site";

/** Construit les données structurées. Une valeur inconnue est omise, jamais remplacée par un faux. */
const drop = <T extends Record<string, unknown>>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== "")) as T;

export const abs = (path: string) => `${SITE.url}${path === "/" ? "" : path}`;

export function localBusiness() {
  const sameAs = [CONTACT.facebook, CONTACT.instagram, CONTACT.googleBusinessUrl].filter(Boolean);
  return drop({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE.url}/#entreprise`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    telephone: CONTACT.phoneE164,
    email: CONTACT.email,
    areaServed: [
      { "@type": "City", name: SITE.city },
      ...COMMUNES.filter((c) => c !== SITE.city).map((name) => ({ "@type": "City", name })),
    ],
    address: drop({
      "@type": "PostalAddress",
      streetAddress: CONTACT.streetAddress,
      postalCode: SITE.postalCode,
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    }),
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    sameAs: sameAs.length ? sameAs : undefined,
    taxID: LEGAL.siret,
    founder: FOUNDER.firstName ? { "@type": "Person", name: FOUNDER.firstName } : undefined,
    knowsAbout: ["Ménage à domicile", "Entretien de grandes maisons", "Intendance de résidence secondaire", "Nettoyage de locaux professionnels"],
    // Volontairement ni AggregateRating ni Review tant qu'il n'existe pas d'avis réels affichés sur le site.
  });
}

export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#site`,
    url: SITE.url,
    name: SITE.name,
    inLanguage: SITE.locale,
    publisher: { "@id": `${SITE.url}/#entreprise` },
  };
}

export function service(opts: { name: string; description: string; path: string; serviceType: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType,
    url: abs(opts.path),
    provider: { "@id": `${SITE.url}/#entreprise` },
    areaServed: { "@type": "City", name: SITE.city },
  };
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function faqPage(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export const serviceList = SERVICES.map((s) => ({ name: s.name, path: s.href, serviceType: s.serviceType, description: s.short }));
export const sapDeclared = sapActive;

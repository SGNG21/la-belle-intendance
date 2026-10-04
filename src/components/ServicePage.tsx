import Link from "next/link";
import { Check } from "./Icons";
import { JsonLd } from "./JsonLd";
import { PageHero } from "./PageHero";
import { Figure } from "./Figure";
import { SapNotice } from "./SapNotice";
import { Faq, type FaqItem } from "./Faq";
import { service } from "@/lib/schema";

export interface ServicePageProps {
  title: string;
  lede: string;
  path: string;
  serviceType: string;
  description: string;
  intro: string[];
  included: { title: string; items: string[] };
  forWhom: { title: string; items: string[] };
  sap?: "menage" | "autre" | "none";
  faqs?: FaqItem[];
  /** Image d'ambiance facultative, affichée en tête de la colonne de texte. */
  image?: { src: string; alt: string; caption?: string };
  extra?: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
}

export function ServicePage(p: ServicePageProps) {
  return (
    <>
      <JsonLd data={service({ name: p.title, description: p.description, path: p.path, serviceType: p.serviceType })} />
      <PageHero title={p.title} lede={p.lede} path={p.path}>
        <div className="btn-row">
          <Link className="btn" href={p.ctaHref ?? "/contact"}>
            {p.ctaLabel ?? "Demander un devis"}
          </Link>
          <Link className="btn btn--ghost" href="/tarifs#simulateur">
            Estimer mon besoin
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="wrap split split--wide-left">
          <div className="prose">
            {p.image ? <Figure src={p.image.src} alt={p.image.alt} caption={p.image.caption} /> : null}
            {p.intro.map((t) => (
              <p key={t}>{t}</p>
            ))}
            {p.extra}
          </div>
          <div style={{ display: "grid", gap: "2.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{p.included.title}</h2>
              <ul className="checklist">
                {p.included.items.map((t) => (
                  <li key={t}>
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{p.forWhom.title}</h2>
              <ul className="checklist">
                {p.forWhom.items.map((t) => (
                  <li key={t}>
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {p.sap !== "none" ? (
        <section className="section section--cream">
          <div className="wrap">
            <SapNotice scope={p.sap ?? "menage"} />
          </div>
        </section>
      ) : null}

      {p.faqs?.length ? (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>Questions fréquentes</h2>
            </div>
            <Faq items={p.faqs} />
          </div>
        </section>
      ) : null}

      <section className="section section--deep on-dark">
        <div className="wrap split">
          <h2>Un devis écrit avant toute intervention</h2>
          <div className="btn-row" style={{ alignSelf: "center" }}>
            <Link className="btn" href={p.ctaHref ?? "/contact"}>
              {p.ctaLabel ?? "Demander un devis"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

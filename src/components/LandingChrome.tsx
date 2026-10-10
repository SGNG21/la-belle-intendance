import Link from "next/link";
import { CONTACT, LEGAL, SITE } from "@/config/site";
import { Monogram } from "./Monogram";
import { Phone } from "./Icons";

/** En-tête d'une page de destination : la marque, et un seul geste possible — appeler. */
export function LandingHeader() {
  return (
    <header className="lp-head">
      <div className="lp-head-in">
        <span className="lp-brand">
          <Monogram className="lp-mono" title={SITE.name} />
          <span>{SITE.name}</span>
        </span>
        {CONTACT.phone ? (
          <a className="lp-tel" href={`tel:${CONTACT.phoneE164 ?? ""}`}>
            <Phone className="lp-tel-ico" />
            <span>{CONTACT.phone}</span>
          </a>
        ) : null}
      </div>
    </header>
  );
}

/** Pied de page minimal : les mentions obligatoires, et le chemin du retour. */
export function LandingFooter() {
  return (
    <footer className="lp-foot">
      <p>
        {SITE.name}
        {LEGAL.siret ? ` · SIRET ${LEGAL.siret}` : ""}
        {CONTACT.email ? ` · ${CONTACT.email}` : ""}
      </p>
      <p>
        <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/confidentialite">Confidentialité</Link> ·{" "}
        <Link href="/">Le site</Link>
      </p>
    </footer>
  );
}

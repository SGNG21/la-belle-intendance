import Link from "next/link";
import { COMMUNES, CONTACT, NAV, SERVICES, SITE } from "@/config/site";
import { Monogram } from "./Monogram";
import { Fill } from "./Fill";
import { CookieSettings } from "./Consent";

export function Footer() {
  return (
    <footer className="site-footer on-dark">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" style={{ marginBottom: "1rem" }}>
              <Monogram />
              <span>{SITE.name}</span>
            </Link>
            <p className="muted" style={{ maxWidth: "20rem" }}>
              {SITE.tagline}. Entretien régulier, grands ménages et gestion de résidence.
            </p>
          </div>
          <div>
            <h2>Prestations</h2>
            <ul>
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>L'entreprise</h2>
            <ul>
              {NAV.filter((n) => n.href !== "/entretien-regulier" && n.href !== "/professionnels" && n.href !== "/grandes-demeures-intendance").map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/joigny">Zone d'intervention</Link>
              </li>
              <li>
                <Link href="/contact">Contact et devis</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Nous joindre</h2>
            <ul>
              <li>
                {SITE.postalCode} {SITE.city}
              </li>
              <li>{CONTACT.phone ? <a href={`tel:${CONTACT.phoneE164 ?? ""}`}>{CONTACT.phone}</a> : <Fill value={CONTACT.phone} label="téléphone" />}</li>
              <li>{CONTACT.email ? <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> : <Fill value={CONTACT.email} label="e-mail" />}</li>
            </ul>
          </div>
        </div>

        <div className="footer-sap">
          <p>
            Deux modes d&apos;intervention au choix : prestation facturée par l&apos;entreprise, ou emploi direct déclaré au CESU. Le crédit d&apos;impôt de 50 % ne s&apos;applique qu&apos;en emploi direct. L&apos;entreprise n&apos;est pas déclarée au titre des services à la personne.
          </p>
          <p>
            © {new Date().getFullYear()} {SITE.name} · <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/confidentialite">Confidentialité</Link> · <CookieSettings />
          </p>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Communes desservies : {COMMUNES.join(", ")}.
          </p>
        </div>
      </div>
    </footer>
  );
}

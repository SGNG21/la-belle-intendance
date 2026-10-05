import Link from "next/link";
import { COMMUNES, CONTACT, NAV, SERVICES, SITE, sapActive } from "@/config/site";
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
              {SITE.tagline}. Intervention à {SITE.city} et dans ses alentours.
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
          {sapActive() ? (
            <p>Entreprise déclarée services à la personne. Le crédit d'impôt de 50 % concerne les prestations de ménage et d'entretien courant du domicile des particuliers.</p>
          ) : (
            <p>Le crédit d'impôt pour services à la personne est ouvert aux entreprises déclarées. Nous l'indiquerons ici dès que notre déclaration sera effective.</p>
          )}
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

import Link from "next/link";
import { CONTACT, NAV, SITE } from "@/config/site";
import { Phone } from "./Icons";
import { Monogram } from "./Monogram";
import { MobileNav } from "./MobileNav";

export function Header() {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <div className="site-header on-dark">
        <div className="wrap">
          <Link className="brand" href="/" aria-label={`${SITE.name}, accueil`}>
            <Monogram />
            <span>{SITE.name}</span>
          </Link>
          <nav className="nav" aria-label="Navigation principale">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
          {CONTACT.phone && CONTACT.phoneE164 ? (
            <a className="header-phone" href={`tel:${CONTACT.phoneE164}`}>
              <Phone />
              <span>{CONTACT.phone}</span>
            </a>
          ) : null}
          <Link className="btn header-cta" href="/contact">
            Demander un devis
          </Link>
          <MobileNav />
        </div>
      </div>
    </>
  );
}

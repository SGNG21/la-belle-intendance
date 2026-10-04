import Link from "next/link";
import { NAV, SITE } from "@/config/site";
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
          <Link className="btn header-cta" href="/contact">
            Demander un devis
          </Link>
          <MobileNav />
        </div>
      </div>
    </>
  );
}

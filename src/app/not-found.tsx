import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Page introuvable", robots: { index: false } };

export default function NotFound() {
  // La 404 vit à la racine, hors du groupe `(site)` : elle porte donc son
  // propre habillage, sinon elle s'afficherait nue.
  return (
    <>
      <Header />
      <main id="contenu">
      <PageHero title="Cette page n'existe pas" lede="Le lien est peut-être ancien. Retrouvez nos prestations ou demandez directement un devis." path="/404" crumbLabel="Page introuvable" />
      <section className="section">
        <div className="wrap btn-row">
          <Link className="btn" href="/">
            Retour à l'accueil
          </Link>
          <Link className="btn btn--ghost" href="/contact">
            Demander un devis
          </Link>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}

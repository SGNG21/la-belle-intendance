import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Page introuvable", robots: { index: false } };

export default function NotFound() {
  return (
    <>
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
    </>
  );
}

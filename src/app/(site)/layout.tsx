import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/**
 * Habillage du site : en-tête, navigation, pied de page.
 *
 * Les pages de destination (groupe `(nu)`) n'en héritent pas : sur une page
 * qui n'a qu'un but — recevoir une demande —, chaque lien de navigation est
 * une sortie possible.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
    </>
  );
}

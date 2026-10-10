/**
 * Pages de destination : aucun habillage, aucune navigation.
 *
 * Sur une page qui n'a qu'un but — recevoir une demande — chaque lien de
 * menu est une sortie possible. Ces pages portent donc leur propre en-tête
 * minimal et leur propre pied de page.
 */
export default function BareLayout({ children }: { children: React.ReactNode }) {
  return <main id="contenu">{children}</main>;
}

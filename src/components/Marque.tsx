import { MonogramColor } from "./MonogramColor";

/**
 * Le logo complet sur un fond sombre.
 *
 * Le monogramme en couleurs — lettres navy, filets d'or, rameau vert —
 * disparaîtrait sur le bleu de l'en-tête. On lui rend donc son fond crème,
 * en pastille, plutôt que de le remplacer par une silhouette blanche : c'est
 * le vrai logo qui s'affiche, pas une approximation.
 */
export function Marque({ className, title }: { className?: string; title?: string }) {
  return (
    <span className={`marque${className ? ` ${className}` : ""}`}>
      <MonogramColor title={title} />
    </span>
  );
}

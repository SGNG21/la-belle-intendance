import { fill, missing } from "@/config/site";

/** Affiche une valeur de config, ou un repère jaune ⟦…⟧ si elle est encore à renseigner. */
export function Fill({ value, label }: { value: string | null | undefined; label: string }) {
  return missing(value) ? <span className="placeholder-flag">{fill(value, label)}</span> : <>{value}</>;
}

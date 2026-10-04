import { JsonLd } from "./JsonLd";
import { faqPage } from "@/lib/schema";

export interface FaqItem {
  q: string;
  /** Texte brut : identique dans l'affichage et dans les données structurées. */
  a: string;
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <>
      <JsonLd data={faqPage(items)} />
      <div className="faq">
        {items.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p className="answer">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}

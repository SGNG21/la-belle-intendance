import Link from "next/link";
import { Sprig } from "./Icons";
import { JsonLd } from "./JsonLd";
import { breadcrumb } from "@/lib/schema";

export function PageHero({
  title,
  lede,
  path,
  crumbLabel,
  children,
}: {
  title: string;
  lede?: string;
  path: string;
  crumbLabel?: string;
  children?: React.ReactNode;
}) {
  const label = crumbLabel ?? title;
  return (
    <header className="page-hero on-dark">
      <Sprig className="sprig" />
      <JsonLd data={breadcrumb([{ name: "Accueil", path: "/" }, { name: label, path }])} />
      <div className="wrap">
        <nav className="crumbs" aria-label="Fil d'Ariane">
          <ol>
            <li>
              <Link href="/">Accueil</Link>
            </li>
            <li aria-current="page">{label}</li>
          </ol>
        </nav>
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
        {children}
      </div>
    </header>
  );
}

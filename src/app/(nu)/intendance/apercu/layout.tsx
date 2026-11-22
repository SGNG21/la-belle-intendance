import type { Metadata } from "next";
import { IntendanceGate } from "@/components/IntendanceGate";
import { OsNav } from "@/components/apercu/OsNav";
import "@/app/os.css";

/**
 * Maquette navigable du Business OS.
 *
 * Données fictives, aucun envoi, aucune écriture. L'espace est verrouillé
 * comme le reste de /intendance et hors index, parce qu'il vit à côté de
 * l'outil réel et qu'on ne veut pas qu'on les confonde.
 */
export const metadata: Metadata = {
  title: "Aperçu — Business OS",
  robots: { index: false, follow: false, nocache: true },
};

export default function ApercuLayout({ children }: { children: React.ReactNode }) {
  return (
    <IntendanceGate>
      <div className="os">
        <OsNav />
        <main className="os-main">{children}</main>
      </div>
    </IntendanceGate>
  );
}

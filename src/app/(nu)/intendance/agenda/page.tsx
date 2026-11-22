import type { Metadata } from "next";
import { IntendanceGate } from "@/components/IntendanceGate";
import { OsNav } from "@/components/apercu/OsNav";
import { AgendaConnecte } from "@/components/intendance/AgendaConnecte";
import "@/app/os.css";

/**
 * L'agenda réel : branché sur /api/intendance/agenda, donc sur
 * projeter_agenda() en base. Aucune donnée fictive ici.
 */
export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return (
    <IntendanceGate>
      <div className="os">
        <OsNav racine="/intendance" />
        <main className="os-main">
          <div className="os-wrap">
            <AgendaConnecte />
          </div>
        </main>
      </div>
    </IntendanceGate>
  );
}

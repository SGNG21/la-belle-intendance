import type { Metadata } from "next";
import { IntendanceGate } from "@/components/IntendanceGate";
import { PassageEcran } from "@/components/intendance/Passage";
import "@/app/os.css";

/**
 * Le passage en cours, sur le téléphone de l'intervenante.
 *
 * Sans coquille de navigation : cet écran se tient d'une main, on n'y vient
 * pas pour naviguer ailleurs. La barre d'action reste en bas, toujours
 * atteignable au pouce.
 */
export const metadata: Metadata = {
  title: "Passage",
  robots: { index: false, follow: false, nocache: true },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <IntendanceGate>
      <div className="os">
        <main className="os-main os-main--nu">
          <PassageEcran id={id} />
        </main>
      </div>
    </IntendanceGate>
  );
}

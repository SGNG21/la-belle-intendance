import { LandingFooter, LandingHeader } from "@/components/LandingChrome";
import { IntendanceGate } from "@/components/IntendanceGate";
import { FicheClient } from "@/components/intendance/Fiche";

export const metadata = {
  title: "Fiche client",
  robots: { index: false, follow: false, nocache: true },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <LandingHeader />
      <IntendanceGate>
        <section className="lp-sec lp-sec--paper">
          <div className="lp-in">
            <FicheClient id={id} />
          </div>
        </section>
      </IntendanceGate>
      <LandingFooter />
    </>
  );
}

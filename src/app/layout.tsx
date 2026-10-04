import type { Metadata, Viewport } from "next";
import "@fontsource/marcellus/400.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource-variable/jost";
import "./globals.css";
import { SITE } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Consent } from "@/components/Consent";
import { JsonLd } from "@/components/JsonLd";
import { localBusiness, website } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.tagline} | ${SITE.name}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  // Indexation désactivée tant que SITE_INDEXABLE n'est pas à "true" (voir launch-check).
  robots: SITE.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { siteName: SITE.name, locale: "fr_FR", type: "website" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#182a45",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <JsonLd data={localBusiness()} />
        <JsonLd data={website()} />
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <Consent />
      </body>
    </html>
  );
}

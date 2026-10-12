import type { Metadata, Viewport } from "next";
import "@fontsource/marcellus/400.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource-variable/jost";
import "./globals.css";
import { SITE } from "@/config/site";
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
  /**
   * Icônes servies depuis /public, donc à des adresses fixes.
   *
   * La convention de fichier de Next (src/app/icon.svg) ajoute une empreinte
   * à l'URL, qui change à chaque déploiement. Google demande une adresse
   * stable pour afficher l'icône d'un site dans ses résultats : tant qu'elle
   * bouge, il garde le globe gris.
   */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icone.svg", type: "image/svg+xml" },
      { url: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
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
        {children}
        <Consent />
      </body>
    </html>
  );
}

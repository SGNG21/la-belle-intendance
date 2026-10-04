import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/entretien-regulier", priority: 0.9 },
  { path: "/grand-menage", priority: 0.8 },
  { path: "/remise-en-etat", priority: 0.7 },
  { path: "/grandes-demeures-intendance", priority: 0.9 },
  { path: "/professionnels", priority: 0.8 },
  { path: "/tarifs", priority: 0.9 },
  { path: "/joigny", priority: 0.8 },
  { path: "/a-propos", priority: 0.6 },
  { path: "/contact", priority: 0.8 },
  { path: "/mentions-legales", priority: 0.2 },
  { path: "/confidentialite", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((p) => ({ url: `${SITE.url}${p.path === "/" ? "" : p.path}`, lastModified, changeFrequency: "monthly", priority: p.priority }));
}

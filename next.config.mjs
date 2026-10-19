/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // robots.txt interdit l'exploration de /api/, mais une URL interdite
        // d'exploration peut quand même être indexée si Google la découvre
        // ailleurs : il voit l'adresse sans pouvoir lire la page, donc sans
        // pouvoir y lire une consigne de désindexation. L'en-tête, lui, se
        // lit à chaque réponse et fait sortir l'URL de l'index.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};
export default nextConfig;

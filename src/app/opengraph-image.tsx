import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#182a45", color: "#f4eee2", padding: 72, fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 84, border: "3px solid #ae8130", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>LB</div>
          <div style={{ fontSize: 34 }}>{SITE.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 76, lineHeight: 1.08, maxWidth: 940 }}>Ménage et intendance de maison à Joigny et alentour</div>
          <div style={{ fontSize: 32, color: "#aec6d2" }}>Particuliers, grandes demeures, entreprises · Yonne</div>
        </div>
      </div>
    ),
    size,
  );
}

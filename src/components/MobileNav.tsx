"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV } from "@/config/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="menu-btn" aria-expanded={open} aria-controls="menu-mobile" onClick={() => setOpen((v) => !v)}>
        {open ? "Fermer" : "Menu"}
      </button>
      {open ? (
        <nav id="menu-mobile" className="mobile-nav on-dark" aria-label="Navigation principale" style={{ position: "absolute", left: 0, right: 0, top: "100%" }}>
          <div className="wrap">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <Link className="btn" href="/contact" onClick={() => setOpen(false)}>
              Demander un devis
            </Link>
          </div>
        </nav>
      ) : null}
    </>
  );
}

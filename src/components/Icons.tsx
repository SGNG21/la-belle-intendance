/** Sceau, rameau botanique et pictogrammes, dessinés pour le site. */

export function Seal({ className, title }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle cx="32" cy="32" r="30" fill="none" stroke="#ae8130" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#ae8130" strokeWidth="0.8" />
      <text x="32" y="40.5" textAnchor="middle" fontFamily="Marcellus, Georgia, serif" fontSize="23" fill="currentColor" letterSpacing="0.5">
        LB
      </text>
    </svg>
  );
}

/** Rameau en trait fin : tige courbe et feuilles alternées. */
export function Sprig({ className }: { className?: string }) {
  const leaves: { x: number; y: number; r: number; s: number }[] = [
    { x: 70, y: 262, r: -55, s: 1.0 },
    { x: 96, y: 232, r: 35, s: 1.05 },
    { x: 128, y: 206, r: -60, s: 1.1 },
    { x: 162, y: 184, r: 30, s: 1.15 },
    { x: 200, y: 166, r: -62, s: 1.2 },
    { x: 238, y: 152, r: 28, s: 1.2 },
    { x: 278, y: 142, r: -64, s: 1.15 },
    { x: 318, y: 136, r: 26, s: 1.05 },
    { x: 356, y: 134, r: -66, s: 0.95 },
    { x: 390, y: 136, r: 22, s: 0.8 },
  ];
  return (
    <svg className={className} viewBox="0 0 440 300" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 290 C 90 270, 150 220, 230 170 S 380 120, 428 138" />
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
          <path d="M0 0 C 10 -22, 36 -26, 52 -10 C 36 6, 12 10, 0 0 Z" />
          <path d="M4 -2 C 18 -8, 32 -10, 46 -10" opacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="8.2" opacity="0.45" />
      <path d="M6.2 10.3 8.9 13l5-5.6" />
    </svg>
  );
}

export function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10.5" r="1.6" />
      <path d="m4 17 5-4.5 3.5 3L16 12l4 4" />
    </svg>
  );
}

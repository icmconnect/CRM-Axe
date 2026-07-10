export function Logo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="centerSun" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" floodColor="#92400E" />
        </filter>
      </defs>

      {/* Background pale circle */}
      <circle cx="50" cy="50" r="48" fill="#FCF8E8" />

      {/* Faint dotted circle */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="#FCD34D" strokeWidth="1" strokeDasharray="2 4" opacity="0.8" />

      {/* Rays and Dots */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`translate(50, 50) rotate(${angle})`}>
          {/* Ray */}
          <polygon points="-4.5,-16 4.5,-16 0,-26" fill="#C25100" />
          {/* Dot */}
          <circle cx="0" cy="-32" r="2.5" fill="#F59E0B" />
        </g>
      ))}

      {/* Center Sun */}
      <circle cx="50" cy="50" r="13" fill="url(#centerSun)" filter="url(#shadow)" />
    </svg>
  );
}

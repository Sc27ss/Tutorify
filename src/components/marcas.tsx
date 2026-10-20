/** Marcas decorativas: personajes en círculos de color, garabatos y destellos. Nunca portan información. */

const PERSONAJES: { cara: string; borde: string; fondo: string; giro: string }[] = [
  { cara: "🦉", borde: "#097fe8", fondo: "#e6f3fe", giro: "-6deg" },
  { cara: "🧮", borde: "#f64932", fondo: "#fff1ee", giro: "4deg" },
  { cara: "🔬", borde: "#ffb110", fondo: "#fff6df", giro: "-3deg" },
  { cara: "📐", borde: "#62aef0", fondo: "#f0f8ff", giro: "6deg" },
  { cara: "🧪", borde: "#f64932", fondo: "#fff1ee", giro: "-5deg" },
  { cara: "📖", borde: "#ffb110", fondo: "#fff6df", giro: "3deg" },
  { cara: "🎓", borde: "#097fe8", fondo: "#e6f3fe", giro: "-4deg" },
];

export function FilaMarcas() {
  return (
    <ul aria-hidden="true" className="flex items-center justify-center -space-x-1.5">
      {PERSONAJES.map((p, i) => (
        <li
          key={i}
          className="animate-spring grid size-11 place-items-center rounded-full text-xl sm:size-12"
          style={{
            animationDelay: `${i * 70}ms`,
            border: `2px solid ${p.borde}`,
            background: p.fondo,
            rotate: p.giro,
          }}
        >
          <span className="animate-float" style={{ animationDelay: `${i * 300}ms` }}>
            {p.cara}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Garabato({ className = "", color = "#ffb110" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 24" fill="none" className={className}>
      <path
        d="M3 14c8-12 14 10 22 0s14 10 22 0 14 10 22 0 14 10 22 0 14 10 24 0"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="120"
        className="animate-draw"
      />
    </svg>
  );
}

export function Destello({ className = "", color = "#f64932" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={`animate-float ${className}`}>
      <path d="M16 2c1 8 6 13 14 14-8 1-13 6-14 14-1-8-6-13-14-14 8-1 13-6 14-14z" fill={color} />
    </svg>
  );
}

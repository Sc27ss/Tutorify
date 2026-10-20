import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

type Variante = "up" | "scale" | "left" | "right";

const CLASE: Record<Variante, string> = {
  up: "reveal",
  scale: "reveal reveal-scale",
  left: "reveal reveal-left",
  right: "reveal reveal-right",
};

/**
 * Revela su contenido con una transición suave cuando entra al viewport (una sola vez).
 * `delay` en ms permite escalonar tarjetas hermanas. Respeta prefers-reduced-motion vía CSS.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  variante = "up",
  como: Etiqueta = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variante?: Variante;
  como?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisible(true);
            observador.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  const estilo = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  return (
    <Etiqueta ref={ref} data-visible={visible} style={estilo} className={`${CLASE[variante]} ${className}`}>
      {children}
    </Etiqueta>
  );
}

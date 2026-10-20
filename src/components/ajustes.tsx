import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Accessibility, Minus, Moon, Plus, RotateCcw, Square, Sun, Volume2, X } from "lucide-react";

import { ESCALAS, useI18n, usePreferencias } from "@/lib/preferencias";

/* ------------------------------------------------------------------ */
/* Lectura en voz alta (Web Speech API, sin dependencias)              */
/* ------------------------------------------------------------------ */

function dividirTexto(texto: string): string[] {
  const frases = texto.replace(/\s+/g, " ").trim().split(/(?<=[.!?:;])\s+/);
  const trozos: string[] = [];
  let actual = "";
  for (const frase of frases) {
    if ((actual + " " + frase).length > 200 && actual) {
      trozos.push(actual);
      actual = frase;
    } else {
      actual = actual ? `${actual} ${frase}` : frase;
    }
  }
  if (actual) trozos.push(actual);
  return trozos.slice(0, 40);
}

function useLecturaEnVoz(idioma: "es" | "en") {
  const [soportado, setSoportado] = useState(false);
  const [leyendo, setLeyendo] = useState(false);

  useEffect(() => {
    setSoportado(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const detener = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setLeyendo(false);
  }, []);

  const leer = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const sintetizador = window.speechSynthesis;
    sintetizador.cancel();
    const seleccion = window.getSelection()?.toString().trim();
    const principal = document.getElementById("contenido");
    const texto = seleccion || principal?.innerText || document.body.innerText;
    const trozos = dividirTexto(texto);
    if (trozos.length === 0) return;

    const prefijo = idioma === "en" ? "en" : "es";
    const voz = sintetizador.getVoices().find((v) => v.lang.toLowerCase().startsWith(prefijo));
    setLeyendo(true);
    trozos.forEach((trozo, indice) => {
      const frase = new SpeechSynthesisUtterance(trozo);
      frase.lang = voz?.lang ?? (idioma === "en" ? "en-US" : "es-CO");
      if (voz) frase.voice = voz;
      if (indice === trozos.length - 1) {
        frase.onend = () => setLeyendo(false);
      }
      frase.onerror = () => setLeyendo(false);
      sintetizador.speak(frase);
    });
  }, [idioma]);

  return { soportado, leyendo, leer, detener };
}

/* ------------------------------------------------------------------ */
/* Piezas de interfaz                                                  */
/* ------------------------------------------------------------------ */

const botonDock =
  "grid size-11 place-items-center rounded-xl text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-offset-0";

function Interruptor({
  activo,
  onChange,
  titulo,
  detalle,
}: {
  activo: boolean;
  onChange: (valor: boolean) => void;
  titulo: string;
  detalle: string;
}) {
  const idDetalle = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-describedby={idDetalle}
      onClick={() => onChange(!activo)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left hover:border-primary"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{titulo}</span>
        <span id={idDetalle} className="block text-xs text-muted-foreground">
          {detalle}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors ${
          activo ? "border-primary bg-primary" : "border-muted-foreground bg-muted"
        }`}
      >
        <span
          className={`size-4.5 rounded-full shadow transition-transform ${
            activo ? "translate-x-5 bg-primary-foreground" : "bg-muted-foreground"
          }`}
        />
      </span>
    </button>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dock flotante: idioma · modo oscuro/claro · accesibilidad           */
/* ------------------------------------------------------------------ */

export function AjustesFlotantes() {
  const { tema, idioma, a11y, setTema, setIdioma, setA11y, restablecerA11y } = usePreferencias();
  const { t } = useI18n();
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const cierre = useRef<HTMLButtonElement>(null);
  const idPanel = useId();
  const idTitulo = useId();
  const voz = useLecturaEnVoz(idioma);

  const oscuro = tema === "oscuro";
  const cambiosActivos =
    a11y.textoNivel > 0 ||
    a11y.contrasteAlto ||
    a11y.fuenteLegible ||
    a11y.espaciadoTexto ||
    a11y.resaltarEnlaces ||
    a11y.sinAnimaciones ||
    a11y.cursorGrande;

  // Enfoque: al abrir va al botón de cerrar; con Esc o al cerrar regresa al botón de accesibilidad.
  useEffect(() => {
    if (!abierto) return;
    cierre.current?.focus();
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAbierto(false);
        disparador.current?.focus();
      }
    };
    const alPulsarFuera = (evento: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alPulsarFuera);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alPulsarFuera);
    };
  }, [abierto]);

  const porcentaje = ESCALAS[a11y.textoNivel];

  return (
    <div
      ref={raiz}
      className="fixed bottom-[10.25rem] right-4 z-40 flex flex-col items-end gap-3 lg:right-6"
    >
      {abierto && (
        <div
          id={idPanel}
          role="dialog"
          aria-labelledby={idTitulo}
          className="animate-pop flex max-h-[calc(100dvh-15rem)] w-[min(22rem,calc(100vw-2rem))] flex-col gap-5 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-float"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={idTitulo} className="text-base font-bold">
                {t("Accesibilidad", "Accessibility")}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(
                  "Activa lo que necesites. Si no activas nada, verás la página normal.",
                  "Turn on what you need. If you turn nothing on, you'll see the regular page.",
                )}
              </p>
            </div>
            <button
              ref={cierre}
              type="button"
              onClick={() => {
                setAbierto(false);
                disparador.current?.focus();
              }}
              aria-label={t("Cerrar panel de accesibilidad", "Close accessibility panel")}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-border hover:bg-accent"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <Grupo titulo={t("Tamaño del texto", "Text size")}>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-2">
              <button
                type="button"
                onClick={() => setA11y({ textoNivel: Math.max(0, a11y.textoNivel - 1) })}
                disabled={a11y.textoNivel === 0}
                aria-label={t("Reducir texto", "Decrease text size")}
                className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
              >
                <Minus aria-hidden="true" className="size-4" />
              </button>
              <p aria-live="polite" className="text-sm font-bold tabular">
                {porcentaje}%
              </p>
              <button
                type="button"
                onClick={() => setA11y({ textoNivel: Math.min(ESCALAS.length - 1, a11y.textoNivel + 1) })}
                disabled={a11y.textoNivel === ESCALAS.length - 1}
                aria-label={t("Aumentar texto", "Increase text size")}
                className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>
          </Grupo>

          <Grupo titulo={t("Visión", "Vision")}>
            <Interruptor
              activo={a11y.contrasteAlto}
              onChange={(contrasteAlto) => setA11y({ contrasteAlto })}
              titulo={t("Contraste alto", "High contrast")}
              detalle={t("Colores más fuertes y bordes marcados.", "Stronger colors and clear borders.")}
            />
            <Interruptor
              activo={a11y.fuenteLegible}
              onChange={(fuenteLegible) => setA11y({ fuenteLegible })}
              titulo={t("Fuente legible", "Readable font")}
              detalle={t("Letra sin adornos y más separada (útil en dislexia).", "Plain, well-spaced letters (helpful for dyslexia).")}
            />
            <Interruptor
              activo={a11y.espaciadoTexto}
              onChange={(espaciadoTexto) => setA11y({ espaciadoTexto })}
              titulo={t("Más espacio en el texto", "More text spacing")}
              detalle={t("Mayor separación entre líneas, palabras y letras.", "More space between lines, words and letters.")}
            />
          </Grupo>

          <Grupo titulo={t("Navegación", "Navigation")}>
            <Interruptor
              activo={a11y.resaltarEnlaces}
              onChange={(resaltarEnlaces) => setA11y({ resaltarEnlaces })}
              titulo={t("Resaltar enlaces y botones", "Highlight links and buttons")}
              detalle={t("Los subraya y los rodea para encontrarlos fácil.", "Underlines and outlines them so they're easy to find.")}
            />
            <Interruptor
              activo={a11y.cursorGrande}
              onChange={(cursorGrande) => setA11y({ cursorGrande })}
              titulo={t("Cursor grande", "Large cursor")}
              detalle={t("Puntero más grande y visible.", "A bigger, easier-to-see pointer.")}
            />
          </Grupo>

          <Grupo titulo={t("Movimiento y sonido", "Motion and sound")}>
            <Interruptor
              activo={a11y.sinAnimaciones}
              onChange={(sinAnimaciones) => setA11y({ sinAnimaciones })}
              titulo={t("Pausar animaciones", "Pause animations")}
              detalle={t("Quita movimientos, destellos y transiciones.", "Removes motion, flashes and transitions.")}
            />
            {voz.soportado && (
              <button
                type="button"
                onClick={voz.leyendo ? voz.detener : voz.leer}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left hover:border-primary"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {voz.leyendo ? t("Detener lectura", "Stop reading") : t("Leer en voz alta", "Read aloud")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(
                      "Lee el texto que selecciones o, si no hay selección, la página.",
                      "Reads the text you select or, if nothing is selected, the page.",
                    )}
                  </span>
                </span>
                {voz.leyendo ? (
                  <Square aria-hidden="true" className="size-5 shrink-0 fill-current text-primary" />
                ) : (
                  <Volume2 aria-hidden="true" className="size-5 shrink-0 text-primary" />
                )}
              </button>
            )}
          </Grupo>

          <button
            type="button"
            onClick={() => {
              voz.detener();
              restablecerA11y();
            }}
            disabled={!cambiosActivos}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/70 disabled:opacity-50"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {t("Restablecer (ver la página normal)", "Reset (show the regular page)")}
          </button>
        </div>
      )}

      <div
        role="group"
        aria-label={t("Preferencias de la página", "Page preferences")}
        className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-1 shadow-float"
      >
        <button
          type="button"
          onClick={() => setIdioma(idioma === "es" ? "en" : "es")}
          aria-label={
            idioma === "es" ? "Cambiar idioma a inglés (Switch to English)" : "Switch language to Spanish (Cambiar a español)"
          }
          title={idioma === "es" ? "English" : "Español"}
          className={botonDock}
        >
          <span aria-hidden="true" className="text-[0.6875rem] font-bold leading-none">
            <span className={idioma === "es" ? "text-primary" : "opacity-60"}>ES</span>
            <span className="opacity-40">/</span>
            <span className={idioma === "en" ? "text-primary" : "opacity-60"}>EN</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTema(oscuro ? "claro" : "oscuro")}
          aria-label={oscuro ? t("Cambiar a modo claro", "Switch to light mode") : t("Cambiar a modo oscuro", "Switch to dark mode")}
          title={oscuro ? t("Modo claro", "Light mode") : t("Modo oscuro", "Dark mode")}
          className={botonDock}
        >
          {oscuro ? <Sun aria-hidden="true" className="size-5" /> : <Moon aria-hidden="true" className="size-5" />}
        </button>

        <button
          ref={disparador}
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls={abierto ? idPanel : undefined}
          aria-haspopup="dialog"
          aria-label={t("Opciones de accesibilidad", "Accessibility options")}
          title={t("Accesibilidad", "Accessibility")}
          className={`${botonDock} ${cambiosActivos ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
        >
          <Accessibility aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}

import { useCallback, useSyncExternalStore } from "react";

import { DATOS_EN } from "@/lib/i18n-datos";

/**
 * Preferencias del usuario: tema (claro/oscuro), idioma (es/en) y opciones de accesibilidad.
 * Se guardan en localStorage y se aplican como clases/atributos sobre <html>.
 * Por defecto TODO está desactivado: el usuario ve la página normal hasta que active algo.
 */

export type Tema = "claro" | "oscuro";
export type Idioma = "es" | "en";

export type Accesibilidad = {
  /** Escala de texto: 0 = 100 %, 1 = 125 %, 2 = 150 %, 3 = 175 %, 4 = 200 % */
  textoNivel: number;
  contrasteAlto: boolean;
  fuenteLegible: boolean;
  espaciadoTexto: boolean;
  resaltarEnlaces: boolean;
  sinAnimaciones: boolean;
  cursorGrande: boolean;
};

export type Preferencias = {
  tema: Tema;
  idioma: Idioma;
  a11y: Accesibilidad;
};

export const CLAVE = "tutorify-preferencias";
export const ESCALAS = [100, 125, 150, 175, 200] as const;

export const A11Y_INICIAL: Accesibilidad = {
  textoNivel: 0,
  contrasteAlto: false,
  fuenteLegible: false,
  espaciadoTexto: false,
  resaltarEnlaces: false,
  sinAnimaciones: false,
  cursorGrande: false,
};

const INICIAL: Preferencias = { tema: "claro", idioma: "es", a11y: A11Y_INICIAL };

let estado: Preferencias = INICIAL;
let cargado = false;
const escuchas = new Set<() => void>();

function leerGuardado(): Preferencias {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    const guardado = crudo ? (JSON.parse(crudo) as Partial<Preferencias>) : null;
    const sistemaOscuro = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const sistemaIngles = (navigator.language ?? "es").toLowerCase().startsWith("en");
    const sinMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const a11y: Accesibilidad = { ...A11Y_INICIAL, ...(guardado?.a11y ?? {}) };
    if (!guardado && sinMovimiento) a11y.sinAnimaciones = true;
    a11y.textoNivel = Math.min(Math.max(Math.round(a11y.textoNivel) || 0, 0), ESCALAS.length - 1);
    return {
      tema: guardado?.tema === "oscuro" || guardado?.tema === "claro" ? guardado.tema : sistemaOscuro ? "oscuro" : "claro",
      idioma: guardado?.idioma === "en" || guardado?.idioma === "es" ? guardado.idioma : sistemaIngles ? "en" : "es",
      a11y,
    };
  } catch {
    return INICIAL;
  }
}

/** Aplica las preferencias al documento (clases, lang, tamaño de letra). */
export function aplicarAlDocumento(p: Preferencias) {
  const raiz = document.documentElement;
  raiz.classList.toggle("dark", p.tema === "oscuro");
  raiz.style.colorScheme = p.tema === "oscuro" ? "dark" : "light";
  raiz.lang = p.idioma;
  raiz.classList.toggle("a11y-contraste", p.a11y.contrasteAlto);
  raiz.classList.toggle("a11y-fuente", p.a11y.fuenteLegible);
  raiz.classList.toggle("a11y-espaciado", p.a11y.espaciadoTexto);
  raiz.classList.toggle("a11y-enlaces", p.a11y.resaltarEnlaces);
  raiz.classList.toggle("a11y-sin-animaciones", p.a11y.sinAnimaciones);
  raiz.classList.toggle("a11y-cursor", p.a11y.cursorGrande);
  raiz.style.fontSize = p.a11y.textoNivel === 0 ? "" : `${ESCALAS[p.a11y.textoNivel]}%`;
  const color = document.querySelector('meta[name="theme-color"]');
  color?.setAttribute("content", p.tema === "oscuro" ? "#191918" : "#f6f5f4");
}

function obtener(): Preferencias {
  if (typeof window === "undefined") return INICIAL;
  if (!cargado) {
    cargado = true;
    estado = leerGuardado();
    aplicarAlDocumento(estado);
  }
  return estado;
}

function cambiar(siguiente: Preferencias) {
  estado = siguiente;
  cargado = true;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(siguiente));
  } catch {
    /* modo privado o almacenamiento lleno: la preferencia vale solo para esta visita */
  }
  aplicarAlDocumento(siguiente);
  escuchas.forEach((aviso) => aviso());
}

function suscribir(aviso: () => void) {
  escuchas.add(aviso);
  return () => escuchas.delete(aviso);
}

export function usePreferencias() {
  const prefs = useSyncExternalStore(suscribir, obtener, () => INICIAL);

  const setTema = useCallback((tema: Tema) => cambiar({ ...obtener(), tema }), []);
  const setIdioma = useCallback((idioma: Idioma) => cambiar({ ...obtener(), idioma }), []);
  const setA11y = useCallback(
    (parcial: Partial<Accesibilidad>) => cambiar({ ...obtener(), a11y: { ...obtener().a11y, ...parcial } }),
    [],
  );
  const restablecerA11y = useCallback(() => cambiar({ ...obtener(), a11y: A11Y_INICIAL }), []);

  return { ...prefs, setTema, setIdioma, setA11y, restablecerA11y };
}

/** Traducción: `t("Hola", "Hello")` devuelve el texto según el idioma activo. */
export function useI18n() {
  const { idioma } = usePreferencias();
  const t = useCallback((es: string, en: string) => (idioma === "en" ? en : es), [idioma]);
  /** Traduce datos de la plataforma (materias, días, planes, estados…) escritos en español. */
  const tr = useCallback((valor: string) => (idioma === "en" ? (DATOS_EN[valor] ?? valor) : valor), [idioma]);
  const locale = idioma === "en" ? "en-US" : "es-CO";
  return { idioma, t, tr, locale };
}

/**
 * Script que corre antes de pintar (en <head>) para que el tema, el idioma y las opciones de
 * accesibilidad no "parpadeen" al cargar la página.
 */
export const SCRIPT_INICIAL = `(function(){try{
var r=document.documentElement,g=JSON.parse(localStorage.getItem('${CLAVE}')||'null');
var oscuro=g&&g.tema?g.tema==='oscuro':window.matchMedia('(prefers-color-scheme: dark)').matches;
var en=g&&g.idioma?g.idioma==='en':(navigator.language||'es').toLowerCase().indexOf('en')===0;
var a=(g&&g.a11y)||{};
if(oscuro){r.classList.add('dark');r.style.colorScheme='dark';}
r.lang=en?'en':'es';
if(a.contrasteAlto)r.classList.add('a11y-contraste');
if(a.fuenteLegible)r.classList.add('a11y-fuente');
if(a.espaciadoTexto)r.classList.add('a11y-espaciado');
if(a.resaltarEnlaces)r.classList.add('a11y-enlaces');
if(a.sinAnimaciones||(!g&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))r.classList.add('a11y-sin-animaciones');
if(a.cursorGrande)r.classList.add('a11y-cursor');
var n=Math.round(a.textoNivel)||0;if(n>0&&n<5)r.style.fontSize=[100,125,150,175,200][n]+'%';
}catch(e){}})();`;

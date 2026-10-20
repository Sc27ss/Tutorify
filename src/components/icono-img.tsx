import { LOGO } from "@/lib/imagenes";

/** Detecta si el "icono" es una URL de imagen o un emoji/texto. */
export function esImagen(icono: string) {
  return /^(https?:)?\/\//.test(icono) || icono.startsWith("/");
}

/** Muestra una imagen (si es URL) o el emoji/texto tal cual. */
export function Icono({ src, className = "size-full" }: { src: string; className?: string }) {
  if (esImagen(src)) {
    return <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} className={`${className} object-contain`} />;
  }
  return <span aria-hidden="true">{src}</span>;
}

/** Logo de Tutorify (reemplaza al antiguo cuadro «Tf»). */
export function LogoImg({ className = "size-10" }: { className?: string }) {
  return <img src={LOGO} alt="" aria-hidden="true" decoding="async" draggable={false} className={`${className} shrink-0 object-contain`} />;
}

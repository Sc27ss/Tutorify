/** Sesión propia con cookie httpOnly + tabla `sesiones`. */
import { deleteCookie, getCookie, getRequestUrl, setCookie } from "@tanstack/react-start/server";

import type { Rol, Usuario } from "@/lib/data/tipos";
import { db, mensajeDeError } from "./cliente.server";
import { rolValido } from "./permisos";

const COOKIE = "tutorify_sesion";
const DIAS = 7;

export type FilaUsuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  tutor_id: number | null;
  activo: boolean;
};

export const aUsuario = (f: FilaUsuario): Usuario => ({
  id: f.id,
  nombre: f.nombre || f.email.split("@")[0] || "Usuario",
  email: f.email,
  rol: f.rol as Rol,
  tutorId: f.tutor_id ?? undefined,
});

function opcionesCookie() {
  const https =
    getRequestUrl({ xForwardedProto: true }).protocol === "https:" || process.env["NODE_ENV"] === "production";
  // Lax protege contra CSRF; Secure en HTTPS (Vercel) y en desarrollo local por HTTP queda sin Secure.
  return { secure: https, sameSite: "lax" as const, path: "/" };
}

export async function abrirSesion(usuarioId: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const expira = new Date(Date.now() + DIAS * 864e5);
  const { error } = await db()
    .from("sesiones")
    .insert({ token, usuario_id: usuarioId, expira: expira.toISOString() });
  if (error) throw new Error(mensajeDeError(error, "No fue posible abrir la sesión."));
  setCookie(COOKIE, token, { httpOnly: true, ...opcionesCookie(), maxAge: DIAS * 86400 });
}

export async function cerrarSesionActual() {
  const token = getCookie(COOKIE);
  if (token) await db().from("sesiones").delete().eq("token", token);
  deleteCookie(COOKIE, opcionesCookie());
}

export async function usuarioActual(): Promise<FilaUsuario | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const { data } = await db()
    .from("sesiones")
    .select("expira, usuarios(id, nombre, email, rol, tutor_id, activo)")
    .eq("token", token)
    .maybeSingle();
  const fila = data as unknown as { expira: string; usuarios: FilaUsuario | null } | null;
  if (fila && new Date(fila.expira) < new Date()) {
    // Sesión caducada: se invalida en la base de datos.
    await db().from("sesiones").delete().eq("token", token);
    return null;
  }
  if (!fila?.usuarios || !rolValido(fila.usuarios.rol) || !fila.usuarios.activo) return null;
  return fila.usuarios;
}

export async function exigir(...roles: Rol[]) {
  const u = await usuarioActual();
  if (!u) throw new Error("Debes iniciar sesión.");
  if (roles.length && !roles.includes(u.rol as Rol)) throw new Error("No autorizado.");
  return u;
}

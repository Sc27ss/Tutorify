/**
 * Cliente privilegiado de Supabase (SOLO servidor).
 * Usa la clave secreta, que nunca debe llegar al navegador ni a git.
 *
 * Variables (ver .env.example):
 *   SUPABASE_URL          URL del proyecto  (también se acepta VITE_SUPABASE_URL)
 *   SUPABASE_SECRET_KEY   clave secreta sb_secret_...  (también se acepta EXT_SUPABASE_SECRET_KEY)
 */
import { createClient } from "@supabase/supabase-js";

/** Proyecto correcto de Tutorify. Cualquier otra URL se rechaza para no usar el proyecto antiguo por accidente. */
export const PROYECTO_ID = "tuieafwffqzbgxokthrb";
export const EXT_URL = `https://${PROYECTO_ID}.supabase.co`;

function leerUrl(): string {
  const url = (process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || EXT_URL).trim().replace(/\/+$/, "");
  if (url !== EXT_URL) {
    throw new Error(`SUPABASE_URL apunta a "${url}", pero Tutorify usa ${EXT_URL}. Corrige la variable de entorno.`);
  }
  return url;
}

function leerClave(): string {
  const key = (process.env["SUPABASE_SECRET_KEY"] || process.env["EXT_SUPABASE_SECRET_KEY"] || "").trim();
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY (clave secreta de Supabase) en las variables de entorno del servidor.");
  return key;
}

export function db() {
  const url = leerUrl();
  const key = leerClave();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        // Las claves nuevas (sb_secret_...) no son JWT: no deben enviarse como Bearer.
        if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Traduce un error de Supabase/PostgREST a un mensaje útil y registra el detalle SOLO en el log del servidor. */
export function mensajeDeError(error: { code?: string; message?: string } | null | undefined, porDefecto: string): string {
  if (!error) return porDefecto;
  console.error("[supabase]", error.code, error.message);
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  if (code === "23505") return "Ese correo ya tiene una cuenta registrada.";
  // función o tabla inexistente => no se ejecutó el SQL en este proyecto
  if (code === "PGRST202" || code === "PGRST205" || code === "42883" || code === "42P01" || msg.includes("schema cache")) {
    return "La base de datos aún no está preparada. Ejecuta el SQL de Tutorify en Supabase (ver README).";
  }
  if (msg.includes("invalid api key") || msg.includes("apikey") || code === "401" || code === "PGRST301") {
    return "La clave secreta de Supabase es inválida o fue revocada. Revisa SUPABASE_SECRET_KEY.";
  }
  if (code === "42501" || msg.includes("permission denied")) {
    return "Permisos insuficientes en la base de datos. Vuelve a ejecutar el SQL de Tutorify.";
  }
  return porDefecto;
}

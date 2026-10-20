/** Cliente del navegador (clave PUBLICABLE) usado solo para el inicio con Google. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PROYECTO_ID = "tuieafwffqzbgxokthrb";
const URL_PROYECTO = `https://${PROYECTO_ID}.supabase.co`;
// La clave publicable es pública por diseño (no es secreta). Se puede sobrescribir con VITE_SUPABASE_PUBLISHABLE_KEY.
const PUBLICABLE_POR_DEFECTO = "sb_publishable_G5uWfgrP9r4FV0R_bupHsw_qQNbYcf7";

function configuracion() {
  const url = String(import.meta.env["VITE_SUPABASE_URL"] || URL_PROYECTO).replace(/\/+$/, "");
  if (url !== URL_PROYECTO) {
    throw new Error(`VITE_SUPABASE_URL apunta a otro proyecto (${url}). Debe ser ${URL_PROYECTO}.`);
  }
  const key = String(
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"] || PUBLICABLE_POR_DEFECTO,
  );
  return { url, key };
}

let cliente: SupabaseClient | undefined;
export function clienteGoogle() {
  if (!cliente) {
    const { url, key } = configuracion();
    cliente = createClient(url, key, {
      auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "tutorify-google" },
    });
  }
  return cliente;
}

export async function iniciarConGoogle() {
  const { error } = await clienteGoogle().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth` },
  });
  return error?.message;
}

// @lovable.dev/vite-tanstack-config ya incluye: TanStack Start, React, Tailwind, rutas con alias "@",
// inyección de variables VITE_* y nitro (solo en build). No añadas esos plugins a mano.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Las variables SIN prefijo VITE_ (claves secretas) nunca llegan al navegador. Se leen de .env.local
// y se copian a process.env para que las funciones de servidor las encuentren en desarrollo y build.
// En Vercel se configuran en Project Settings → Environment Variables (ya vienen en process.env).
const env = loadEnv(process.env["NODE_ENV"] === "production" ? "production" : "development", process.cwd(), "");
for (const nombre of ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "EXT_SUPABASE_SECRET_KEY"]) {
  if (!process.env[nombre] && env[nombre]) process.env[nombre] = env[nombre];
}

// Vercel define VERCEL=1 durante el build: se usa el preset "vercel" de Nitro.
// En cualquier otro sitio se conserva el comportamiento original del proyecto.
const enVercel = Boolean(process.env["VERCEL"]);

export default defineConfig({
  tanstackStart: {
    // Redirige la entrada del servidor de TanStack Start a src/server.ts (envoltorio de errores SSR).
    server: { entry: "server" },
  },
  ...(enVercel ? { nitro: { preset: "vercel" } } : {}),
});

import { it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL("../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PROYECTO_NUEVO = "tuieafwffqzbgxokthrb";
const PROYECTO_ANTIGUO = "lpafyszzojuavutqrixq";

function archivos(dir: string, salida: string[] = []): string[] {
  for (const nombre of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", ".output", ".vercel", ".tanstack", ".nitro"].includes(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) archivos(ruta, salida);
    else salida.push(ruta);
  }
  return salida;
}

const CODIGO = archivos(RAIZ).filter((f) => !f.includes("supabase/legacy") && !f.includes("supabase\\legacy") && !/\.(png|ico|webp|lock)$|package-lock\.json$|configuracion\.test\.ts$/.test(f));

it("ningún archivo del proyecto activo apunta al proyecto Supabase antiguo", () => {
  for (const f of CODIGO) assert.ok(!readFileSync(f, "utf8").includes(PROYECTO_ANTIGUO), `${f} menciona el proyecto antiguo`);
});

it("el cliente servidor y el de Google usan el proyecto correcto", () => {
  for (const f of ["src/lib/externo/cliente.server.ts", "src/lib/externo/google.ts"]) {
    assert.ok(readFileSync(join(RAIZ, f), "utf8").includes(PROYECTO_NUEVO), f);
  }
});

it("no hay claves secretas reales en el repositorio", () => {
  for (const f of CODIGO) {
    const txt = readFileSync(f, "utf8");
    for (const m of txt.matchAll(/sb_secret_([A-Za-z0-9_-]+)/g)) {
      assert.ok(/^(x+|REEMPLAZA_CON_TU_CLAVE_SECRETA)$/.test(m[1] ?? ""), `posible clave secreta en ${f}`);
    }
    assert.ok(!/service_role["']?\s*[:=]\s*["']eyJ/.test(txt), `JWT service_role en ${f}`);
  }
});

it("no existen .env/.env.local con secretos y .env.example solo trae marcadores", () => {
  assert.ok(!existsSync(join(RAIZ, ".env")));
  assert.ok(!existsSync(join(RAIZ, ".env.local")));
  assert.ok(existsSync(join(RAIZ, ".env.example")));
});

it("la clave secreta no se lee con prefijo VITE_ ni se importa desde código del navegador", () => {
  for (const f of CODIGO.filter((f) => /\.(ts|tsx)$/.test(f))) {
    const txt = readFileSync(f, "utf8");
    assert.ok(!/VITE_[A-Z_]*SECRET/.test(txt), `${f} expone una clave secreta con VITE_`);
    if (!/\.server\.ts$|\.functions\.ts$|server\.ts$|vite\.config\.ts$|\.test\.ts$/.test(f)) {
      assert.ok(!/SUPABASE_SECRET_KEY|cliente\.server/.test(txt), `${f} (cliente) referencia la clave secreta`);
    }
  }
});

it("el código usa getRequestUrl (existe en TanStack Start 1.168) y no getRequestURL", () => {
  assert.ok(!readFileSync(join(RAIZ, "src/lib/externo/sesion.server.ts"), "utf8").includes("getRequestURL"));
});

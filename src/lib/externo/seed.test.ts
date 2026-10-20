import { it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (ruta: string) => readFileSync(new URL(`../../../${ruta}`, import.meta.url), "utf8");
const MIGRACION = "supabase/migrations/20261019000000_tutorify_esquema.sql";

it("la migración crea las 4 tablas, con RLS activo y sin acceso para anon/authenticated", () => {
  const sql = leer(MIGRACION);
  for (const tabla of ["usuarios", "sesiones", "solicitudes", "tareas"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${tabla}\\b`));
    assert.match(sql, new RegExp(`alter table public\\.${tabla}\\s+enable row level security;`));
  }
  assert.ok(sql.includes("revoke all on public.usuarios, public.sesiones, public.solicitudes, public.tareas from anon, authenticated;"));
  assert.ok(sql.includes("to service_role;"));
});

it("las funciones RPC que usa el código existen con los parámetros exactos y solo las ejecuta service_role", () => {
  const sql = leer(MIGRACION);
  assert.match(sql, /function public\.crear_usuario\(\s*p_nombre text, p_email text, p_clave text, p_rol text, p_tutor_id integer default null/);
  assert.match(sql, /function public\.verificar_login\(p_email text, p_clave text\)/);
  assert.match(sql, /function public\.cambiar_clave\(p_id uuid, p_clave text\)/);
  assert.match(sql, /revoke execute on function[\s\S]*from public, anon, authenticated;/);
  const codigo = leer("src/lib/externo/auth.functions.ts") + leer("src/lib/externo/admin.functions.ts");
  for (const p of ["p_nombre", "p_email", "p_clave", "p_rol", "p_tutor_id"]) assert.ok(codigo.includes(p), p);
});

it("las contraseñas siempre se cifran con bcrypt (nunca texto plano)", () => {
  const sql = leer(MIGRACION);
  assert.ok(sql.includes("crypt(p_clave, gen_salt('bf', 10))"));
  assert.ok(!/password_hash\s*=\s*p_clave/.test(sql));
});

it("la migración no es destructiva ni resetea contraseñas", () => {
  const sql = leer(MIGRACION).replace(/--.*$/gm, "");
  assert.ok(!/drop\s+table|truncate|delete\s+from\s+public\.usuarios|update\s+public\.usuarios\s+set\s+password_hash\s*=\s*crypt\('/i.test(sql));
});

it("supabase-tutorify.sql es esquema + demo y el demo no pisa cuentas existentes", () => {
  const todo = leer("supabase-tutorify.sql");
  assert.ok(todo.includes(leer(MIGRACION).trim()));
  assert.match(todo, /'admin@gmail\.com',\s*crypt\('admin123',\s*gen_salt\('bf',\s*10\)\),\s*'admin',\s*null/);
  assert.match(todo, /on conflict do nothing;/);
  assert.ok(!/update public\.usuarios\s+set rol = 'admin', activo = true, password_hash/.test(todo));
});

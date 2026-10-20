import { it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (ruta: string) => readFileSync(new URL(`../../../${ruta}`, import.meta.url), "utf8");
const MIG = "supabase/migrations/20261020000000_perfiles_tutor.sql";
const sinComentarios = (sql: string) => sql.replace(/--.*$/gm, "");

it("la migración de perfiles crea la tabla con RLS activo y sin acceso para anon/authenticated", () => {
  const sql = leer(MIG);
  assert.match(sql, /create table if not exists public\.perfiles_tutor\b/);
  assert.match(sql, /alter table public\.perfiles_tutor enable row level security;/);
  assert.ok(sql.includes("revoke all on public.perfiles_tutor from anon, authenticated;"));
  assert.ok(sql.includes("grant  all on public.perfiles_tutor to service_role;"));
  for (const columna of ["ciudad", "titulo", "nivel", "biografia", "materias", "dias", "horas", "precio_hora"]) {
    assert.match(sql, new RegExp(`\\b${columna}\\b`), columna);
  }
});

it("crear_profesor tiene los parámetros que usa el código y solo la ejecuta service_role", () => {
  const sql = leer(MIG);
  const codigo = leer("src/lib/externo/profesores.functions.ts");
  for (const p of ["p_nombre", "p_email", "p_clave", "p_ciudad", "p_titulo", "p_nivel", "p_biografia", "p_materias", "p_dias", "p_horas", "p_precio"]) {
    assert.ok(sql.includes(p), `SQL sin ${p}`);
    assert.ok(codigo.includes(p), `código sin ${p}`);
  }
  assert.match(sql, /revoke execute on function public\.crear_profesor[\s\S]*from public, anon, authenticated;/);
  assert.match(sql, /grant\s+execute on function public\.crear_profesor[\s\S]*to service_role;/);
  assert.ok(sql.includes("public.crear_usuario(p_nombre, p_email, p_clave, 'tutor', null)"), "debe reutilizar crear_usuario (bcrypt + tutor_id)");
});

it("las migraciones y semillas de profesores no son destructivas ni guardan contraseñas en claro", () => {
  for (const archivo of [MIG, "supabase/seed-profesores.sql"]) {
    const sql = sinComentarios(leer(archivo));
    assert.ok(!/drop\s+table|truncate|delete\s+from|alter\s+table\s+public\.usuarios|update\s+public\.usuarios/i.test(sql), archivo);
  }
  const semilla = sinComentarios(leer("supabase/seed-profesores.sql"));
  assert.ok(semilla.includes("crypt(clave_temporal, gen_salt('bf', 10))"));
  assert.ok(semilla.includes("on conflict (email) do nothing"));
  assert.ok(semilla.includes("on conflict (usuario_id) do nothing"));
});

it("la semilla crea los 6 profesores pedidos, uno por materia", () => {
  const sql = leer("supabase/seed-profesores.sql");
  const esperados: Array<[string, string]> = [
    ["Liliana", "Matemáticas"],
    ["Lina", "Química"],
    ["Luis Ángel", "Física"],
    ["Elimeleth", "Lectura Crítica"],
    ["María Victoria", "Biología"],
    ["Camilo", "Cálculo"],
  ];
  for (const [nombre, materia] of esperados) {
    const bloque = sql.split(`('${nombre}',`)[1];
    assert.ok(bloque, `falta ${nombre}`);
    assert.ok(bloque.split("), (")[0]!.split("\n").slice(0, 8).join("\n").includes(`array['${materia}']`), `${nombre} sin ${materia}`);
  }
});

it("supabase-profesores.sql y supabase-tutorify.sql contienen migración y semilla", () => {
  for (const archivo of ["supabase-profesores.sql", "supabase-tutorify.sql"]) {
    const todo = leer(archivo);
    assert.ok(todo.includes(leer(MIG).trim()), `${archivo} sin migración`);
    assert.ok(todo.includes(leer("supabase/seed-profesores.sql").trim()), `${archivo} sin semilla`);
  }
});

it("las funciones públicas no exponen correos y las de administración exigen rol admin", () => {
  const codigo = leer("src/lib/externo/profesores.functions.ts");
  const publica = codigo.split("Administración")[0]!;
  assert.ok(!/\bemail\b/.test(publica), "la lectura pública no debe seleccionar email");
  assert.ok(codigo.includes('exigir("admin")'));
  for (const f of ["listarPerfilesProfesores", "crearProfesor", "actualizarPerfilProfesor"]) {
    const trozo = codigo.split(`export const ${f}`)[1]!.split("export const")[0]!;
    assert.ok(trozo.includes("base()"), `${f} debe validar admin`);
  }
});

/** Perfiles de profesores: lectura pública (landing) y gestión desde el panel de administrador. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DIAS, MATERIAS, type Nivel, type Tutor } from "@/data/tutoraula";

export type PerfilDatos = {
  ciudad: string;
  titulo: string;
  nivel: Nivel;
  biografia: string;
  materias: string[];
  dias: string[];
  horas: string[];
  precioHora: number;
  calificacion: number;
  totalResenas: number;
};
export type PerfilProfesor = PerfilDatos & { usuarioId: string };

type FilaPerfil = {
  ciudad: string | null;
  titulo: string | null;
  nivel: string | null;
  biografia: string | null;
  materias: string[] | null;
  dias: string[] | null;
  horas: string[] | null;
  precio_hora: number | null;
  calificacion: number | string | null;
  total_resenas: number | null;
};

const NIVELES_VALIDOS: Nivel[] = ["primaria", "bachillerato", "icfes", "universidad"];

const ordenDias = (dias: string[]) => [...new Set(dias)].sort((a, b) => DIAS.indexOf(a) - DIAS.indexOf(b));
const ordenHoras = (horas: string[]) => [...new Set(horas)].sort();

function aDatos(f: FilaPerfil): PerfilDatos {
  const nivel = NIVELES_VALIDOS.find((n) => n === f.nivel) ?? "bachillerato";
  return {
    ciudad: f.ciudad || "Medellín",
    titulo: f.titulo ?? "",
    nivel,
    biografia: f.biografia ?? "",
    materias: f.materias ?? [],
    dias: ordenDias(f.dias ?? []),
    horas: ordenHoras(f.horas ?? []),
    precioHora: Number(f.precio_hora ?? 0),
    calificacion: Number(f.calificacion ?? 0),
    totalResenas: Number(f.total_resenas ?? 0),
  };
}

/** PostgREST devuelve el perfil como objeto (relación 1 a 1); por seguridad también se acepta un arreglo. */
const unico = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

/**
 * Profesores activos con perfil, para la página de inicio. Es público, por eso NO devuelve correos.
 * Si la tabla todavía no existe (no se ejecutó el SQL), devuelve ok:false y la página usa su catálogo de respaldo.
 */
export const listarTutoresPublicos = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { db } = await import("./cliente.server");
    const { data, error } = await db()
      .from("usuarios")
      .select(
        "nombre, tutor_id, perfiles_tutor!inner(ciudad, titulo, nivel, biografia, materias, dias, horas, precio_hora, calificacion, total_resenas)",
      )
      .eq("rol", "tutor")
      .eq("activo", true)
      .not("tutor_id", "is", null)
      .order("tutor_id", { ascending: true });
    if (error) {
      console.error("[listarTutoresPublicos]", error.code, error.message);
      return { ok: false, tutores: [] as Tutor[] };
    }
    const filas = (data ?? []) as unknown as Array<{
      nombre: string;
      tutor_id: number;
      perfiles_tutor: FilaPerfil | FilaPerfil[] | null;
    }>;
    const tutores: Tutor[] = [];
    for (const f of filas) {
      const perfil = unico(f.perfiles_tutor);
      if (!perfil) continue;
      const d = aDatos(perfil);
      if (d.materias.length === 0) continue; // perfil incompleto: no se muestra hasta completarlo
      tutores.push({
        id: f.tutor_id,
        nombre: f.nombre,
        ciudad: d.ciudad,
        nivel: d.nivel,
        titulo: d.titulo,
        biografia: d.biografia,
        precioHora: d.precioHora,
        calificacion: d.calificacion,
        totalResenas: d.totalResenas,
        materias: d.materias,
        dias: d.dias,
        horas: d.horas,
      });
    }
    return { ok: true, tutores };
  } catch (e) {
    console.error("[listarTutoresPublicos]", e);
    return { ok: false, tutores: [] as Tutor[] };
  }
});

/* ------------------------------------------------------------------ */
/* Administración                                                      */
/* ------------------------------------------------------------------ */

async function base() {
  const { db } = await import("./cliente.server");
  const { exigir } = await import("./sesion.server");
  const yo = await exigir("admin");
  return { cliente: db(), yo };
}

const enumDe = (valores: string[]) => z.enum(valores as [string, ...string[]]);

const perfilEntrada = z.object({
  ciudad: z.string().trim().min(2).max(80),
  titulo: z.string().trim().min(2).max(120),
  nivel: z.enum(["primaria", "bachillerato", "icfes", "universidad"]),
  biografia: z.string().trim().min(10).max(300),
  materias: z.array(enumDe(MATERIAS)).min(1).max(MATERIAS.length),
  dias: z.array(enumDe(DIAS)).min(1).max(DIAS.length),
  horas: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).max(24),
  precioHora: z.number().int().min(1000).max(1_000_000),
});

export const listarPerfilesProfesores = createServerFn({ method: "GET" }).handler(async () => {
  const { cliente } = await base();
  const { mensajeDeError } = await import("./cliente.server");
  const { data, error } = await cliente
    .from("perfiles_tutor")
    .select("usuario_id, ciudad, titulo, nivel, biografia, materias, dias, horas, precio_hora, calificacion, total_resenas");
  if (error) {
    return { ok: false, error: mensajeDeError(error, "No fue posible cargar los perfiles."), perfiles: [] as PerfilProfesor[] };
  }
  const filas = (data ?? []) as unknown as Array<FilaPerfil & { usuario_id: string }>;
  return {
    ok: true,
    error: "",
    perfiles: filas.map((f): PerfilProfesor => ({ usuarioId: f.usuario_id, ...aDatos(f) })),
  };
});

export const crearProfesor = createServerFn({ method: "POST" })
  .validator((d) =>
    perfilEntrada
      .extend({
        nombre: z.string().trim().min(2).max(100),
        email: z.string().trim().toLowerCase().email().max(180),
        password: z.string().min(6).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { cliente } = await base();
    const { mensajeDeError } = await import("./cliente.server");
    const { error } = await cliente.rpc("crear_profesor", {
      p_nombre: data.nombre,
      p_email: data.email,
      p_clave: data.password,
      p_ciudad: data.ciudad,
      p_titulo: data.titulo,
      p_nivel: data.nivel,
      p_biografia: data.biografia,
      p_materias: [...new Set(data.materias)],
      p_dias: ordenDias(data.dias),
      p_horas: ordenHoras(data.horas),
      p_precio: data.precioHora,
    });
    if (error) return { ok: false, error: mensajeDeError(error, "No se pudo registrar al profesor.") };
    return { ok: true, error: "" };
  });

export const actualizarPerfilProfesor = createServerFn({ method: "POST" })
  .validator((d) =>
    perfilEntrada
      .extend({ id: z.string().uuid(), nombre: z.string().trim().min(2).max(100).optional() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { cliente } = await base();
    const { mensajeDeError } = await import("./cliente.server");
    const { data: usuario, error: consulta } = await cliente
      .from("usuarios")
      .select("id, rol")
      .eq("id", data.id)
      .maybeSingle();
    if (consulta) return { ok: false, error: mensajeDeError(consulta, "No fue posible consultar al profesor.") };
    if (!usuario || usuario.rol !== "tutor") return { ok: false, error: "Esa cuenta no es de un profesor." };

    if (data.nombre) {
      const { error } = await cliente.from("usuarios").update({ nombre: data.nombre }).eq("id", data.id);
      if (error) return { ok: false, error: mensajeDeError(error, "No se pudo actualizar el nombre.") };
    }
    const { error } = await cliente.from("perfiles_tutor").upsert(
      {
        usuario_id: data.id,
        ciudad: data.ciudad,
        titulo: data.titulo,
        nivel: data.nivel,
        biografia: data.biografia,
        materias: [...new Set(data.materias)],
        dias: ordenDias(data.dias),
        horas: ordenHoras(data.horas),
        precio_hora: data.precioHora,
        actualizado: new Date().toISOString(),
      },
      { onConflict: "usuario_id" },
    );
    if (error) return { ok: false, error: mensajeDeError(error, "No se pudo guardar el perfil.") };
    return { ok: true, error: "" };
  });

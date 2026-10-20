/** RF-04/RF-06: compras y tareas, con permisos verificados en el servidor. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { EstadoSolicitud, Solicitud, Tarea } from "@/lib/data/tipos";
import { puedeAccederSolicitud } from "./permisos";
import { MEET_LINK } from "@/data/tutoraula";

type FilaS = Record<string, unknown>;
const aSolicitud = (f: FilaS): Solicitud => ({
  id: String(f["id"]),
  referencia: String(f["referencia"]),
  estudianteId: String(f["estudiante_id"]),
  estudianteNombre: String(f["estudiante_nombre"] ?? ""),
  materia: String(f["materia"]),
  plan: String(f["plan"]),
  monto: Number(f["monto"]),
  dia: String(f["dia"] ?? ""),
  hora: String(f["hora"] ?? ""),
  metodo: String(f["metodo"] ?? ""),
  estado: f["estado"] as EstadoSolicitud,
  tutorId: (f["tutor_id"] as number | null) ?? undefined,
  tutorNombre: (f["tutor_nombre"] as string | null) ?? undefined,
  meet: (f["meet"] as string | null) ?? undefined,
  creada: String(f["created_at"]),
  nota: (f["nota"] as string | null) ?? undefined,
});
const aTarea = (f: FilaS): Tarea => ({
  id: String(f["id"]),
  solicitudId: String(f["solicitud_id"]),
  titulo: String(f["titulo"]),
  descripcion: String(f["descripcion"] ?? ""),
  entrega: String(f["entrega"] ?? ""),
  estado: f["estado"] === "entregada" ? "entregada" : "pendiente",
});

export const cargarDatos = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./cliente.server");
  const { usuarioActual } = await import("./sesion.server");
  const u = await usuarioActual();
  if (!u) return { solicitudes: [] as Solicitud[], tareas: [] as Tarea[] };
  let q = db().from("solicitudes").select("*").order("created_at", { ascending: false });
  if (u.rol === "estudiante") q = q.eq("estudiante_id", u.id);
  if (u.rol === "tutor") q = q.eq("tutor_id", u.tutor_id ?? -1);
   const { data: sol, error: solError } = await q;
   if (solError) throw new Error("No fue posible cargar las compras.");
  const solicitudes = (sol ?? []).map(aSolicitud);
  const ids = solicitudes.map((s) => s.id);
  let tareas: Tarea[] = [];
  if (ids.length) {
    const { data: t, error: tareaError } = await db()
      .from("tareas")
      .select("*")
      .in("solicitud_id", ids)
      .order("created_at", { ascending: false });
    if (tareaError) throw new Error("No fue posible cargar las tareas.");
    tareas = (t ?? []).map(aTarea);
  }
  return { solicitudes, tareas };
});

export const crearSolicitud = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        referencia: z.string().max(40),
        materia: z.string().max(80),
        plan: z.string().max(80),
        monto: z.number().nonnegative(),
        dia: z.string().max(40),
        hora: z.string().max(40),
        metodo: z.string().max(40),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./cliente.server");
    const { exigir } = await import("./sesion.server");
    const u = await exigir("estudiante");
    const { error } = await db()
      .from("solicitudes")
      .insert({ ...data, estudiante_id: u.id, estudiante_nombre: u.nombre, estado: "pendiente" });
    return { ok: !error };
  });

export const decidirSolicitud = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        id: z.string().uuid(),
        aprobar: z.boolean(),
        tutorId: z.number().int().optional(),
        tutorNombre: z.string().optional(),
        meet: z.string().optional(),
        nota: z.string().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./cliente.server");
    const { exigir } = await import("./sesion.server");
    await exigir("admin");
    const { data: tutor, error: tutorError } = data.aprobar
      ? await db().from("usuarios").select("nombre, tutor_id").eq("rol", "tutor").eq("activo", true).eq("tutor_id", data.tutorId ?? -1).limit(1).maybeSingle()
      : { data: null, error: null };
    if (data.aprobar && (tutorError || !tutor)) throw new Error("Selecciona un profesor activo.");
    const cambios = data.aprobar
      ? { estado: "aprobada", tutor_id: data.tutorId, tutor_nombre: tutor?.nombre, meet: MEET_LINK, nota: null }
      : { estado: "rechazada", nota: data.nota ?? null };
    const { error } = await db().from("solicitudes").update(cambios).eq("id", data.id);
    if (error) throw new Error("No fue posible guardar la decisión.");
    return { ok: true };
  });

async function puedeGestionar(solicitudId: string, soloProfesor: boolean) {
  const { db } = await import("./cliente.server");
  const { exigir } = await import("./sesion.server");
  const u = await exigir();
  if (u.rol === "admin") return;
  const { data: s } = await db().from("solicitudes").select("estudiante_id, tutor_id").eq("id", solicitudId).maybeSingle();
  if (!s) throw new Error("No encontrada.");
  if (puedeAccederSolicitud(u, s, soloProfesor)) return;
  throw new Error("No autorizado.");
}

export const crearTarea = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({ solicitudId: z.string().uuid(), titulo: z.string().min(1).max(150), descripcion: z.string().max(2000), entrega: z.string().max(40) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./cliente.server");
    await puedeGestionar(data.solicitudId, true);
    const { error } = await db().from("tareas").insert({
      solicitud_id: data.solicitudId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      entrega: data.entrega,
      estado: "pendiente",
    });
    if (error) throw new Error("No fue posible crear la tarea.");
    return { ok: true };
  });

async function solicitudDeTarea(id: string) {
  const { db } = await import("./cliente.server");
  const { data } = await db().from("tareas").select("solicitud_id").eq("id", id).maybeSingle();
  if (!data) throw new Error("Tarea no encontrada.");
  return data.solicitud_id as string;
}

export const marcarTarea = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string().uuid(), estado: z.enum(["pendiente", "entregada"]) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./cliente.server");
    await puedeGestionar(await solicitudDeTarea(data.id), false);
    const { error } = await db().from("tareas").update({ estado: data.estado }).eq("id", data.id);
    if (error) throw new Error("No fue posible actualizar la tarea.");
    return { ok: true };
  });

export const eliminarTarea = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./cliente.server");
    await puedeGestionar(await solicitudDeTarea(data.id), true);
    const { error } = await db().from("tareas").delete().eq("id", data.id);
    if (error) throw new Error("No fue posible eliminar la tarea.");
    return { ok: true };
  });

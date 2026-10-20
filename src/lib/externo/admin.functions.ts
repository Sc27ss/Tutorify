/** Gestión de usuarios desde el panel de administrador. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { protegeAccesoPropio } from "./permisos";

export type UsuarioAdmin = {
  id: string;
  nombre: string;
  email: string;
  rol: "estudiante" | "tutor" | "admin";
  tutorId: number | null;
  activo: boolean;
  proveedor: string;
  creado: string;
};

const rol = z.enum(["estudiante", "tutor", "admin"]);

async function base() {
  const { db } = await import("./cliente.server");
  const { exigir } = await import("./sesion.server");
  const yo = await exigir("admin");
  return { cliente: db(), yo };
}

export const listarUsuarios = createServerFn({ method: "GET" }).handler(async () => {
  const { cliente } = await base();
  const { data, error } = await cliente
    .from("usuarios")
    .select("id, nombre, email, rol, tutor_id, activo, proveedor, creado")
    .order("creado", { ascending: false });
  if (error) throw new Error("No fue posible cargar los usuarios.");
  return (data ?? []).map(
    (f): UsuarioAdmin => ({
      id: f.id,
      nombre: f.nombre,
      email: f.email,
      rol: f.rol,
      tutorId: f.tutor_id,
      activo: f.activo,
      proveedor: f.proveedor,
      creado: f.creado,
    }),
  );
});

export const crearUsuario = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        nombre: z.string().trim().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6).max(100),
        rol,
        tutorId: z.number().int().positive().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { cliente } = await base();
    const { mensajeDeError } = await import("./cliente.server");
    const { error } = await cliente.rpc("crear_usuario", {
      p_nombre: data.nombre,
      p_email: data.email,
      p_clave: data.password,
      p_rol: data.rol,
      p_tutor_id: data.rol === "tutor" ? (data.tutorId ?? null) : null,
    });
    if (error) return { ok: false, error: mensajeDeError(error, "No se pudo crear.") };
    return { ok: true, error: "" };
  });

export const actualizarUsuario = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        id: z.string().uuid(),
        rol: rol.optional(),
        tutorId: z.number().int().positive().nullable().optional(),
        activo: z.boolean().optional(),
        password: z.string().min(6).max(100).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { cliente, yo } = await base();
    if (protegeAccesoPropio(yo.id, data.id, data.rol, data.activo)) {
      return { ok: false, error: "No puedes quitarte tu propio acceso de administrador." };
    }
    const cambios: Record<string, unknown> = {};
    if (data.rol) cambios["rol"] = data.rol;
    if (data.tutorId !== undefined) cambios["tutor_id"] = data.tutorId;
    if (data.activo !== undefined) cambios["activo"] = data.activo;
    if (data.rol && data.rol !== "tutor") cambios["tutor_id"] = null;
    if (Object.keys(cambios).length) {
      const { error } = await cliente.from("usuarios").update(cambios).eq("id", data.id);
      if (error) return { ok: false, error: "No se pudo actualizar el usuario." };
    }
    if (data.password) {
      const { error } = await cliente.rpc("cambiar_clave", { p_id: data.id, p_clave: data.password });
      if (error) return { ok: false, error: "No se pudo cambiar la contraseña." };
    }
    if (data.activo === false || data.password || data.rol) {
      const { error } = await cliente.from("sesiones").delete().eq("usuario_id", data.id);
      if (error) return { ok: false, error: "No se pudieron cerrar las sesiones anteriores." };
    }
    return { ok: true, error: "" };
  });

export const eliminarUsuario = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { cliente, yo } = await base();
    if (data.id === yo.id) return { ok: false, error: "No puedes eliminar tu propia cuenta." };
    const { error } = await cliente.from("usuarios").delete().eq("id", data.id);
    if (error) return { ok: false, error: "No se pudo eliminar el usuario." };
    return { ok: true, error: "" };
  });

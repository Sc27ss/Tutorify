/** RF-01: registro, login, Google y sesión contra la tabla `usuarios`. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const correo = z.string().trim().toLowerCase().email().max(180);

export const sesionActual = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { usuarioActual, aUsuario } = await import("./sesion.server");
    const u = await usuarioActual();
    return u ? aUsuario(u) : null;
  } catch (e) {
    console.error("[sesionActual]", e);
    return null;
  }
});

export const loginCorreo = createServerFn({ method: "POST" })
  .validator((d) => z.object({ email: correo, password: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { db, mensajeDeError } = await import("./cliente.server");
      const { abrirSesion, aUsuario } = await import("./sesion.server");
      const { data: filas, error } = await db().rpc("verificar_login", {
        p_email: data.email,
        p_clave: data.password,
      });
      if (error) return { ok: false as const, error: mensajeDeError(error, "No fue posible iniciar sesión. Inténtalo nuevamente.") };
      const u = (filas as Array<Parameters<typeof aUsuario>[0]> | null)?.[0];
      if (!u) return { ok: false as const, error: "Correo o contraseña incorrectos." };
      if (!u.activo) return { ok: false as const, error: "Tu cuenta está desactivada." };
      await abrirSesion(u.id);
      return { ok: true as const, usuario: aUsuario(u) };
    } catch (e) {
      console.error("[loginCorreo]", e);
      return { ok: false as const, error: "No fue posible conectar con la base de datos. Inténtalo nuevamente." };
    }
  });

export const registroEstudiante = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        nombre: z.string().trim().min(2, "El nombre es muy corto.").max(100),
        email: correo,
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      const { db, mensajeDeError } = await import("./cliente.server");
      const { abrirSesion, aUsuario } = await import("./sesion.server");
      const { data: fila, error } = await db().rpc("crear_usuario", {
        p_nombre: data.nombre,
        p_email: data.email,
        p_clave: data.password,
        p_rol: "estudiante", // regla: el registro público solo crea estudiantes
        p_tutor_id: null,
      });
      if (error) return { ok: false as const, error: mensajeDeError(error, "No fue posible crear la cuenta.") };
      const u = fila as Parameters<typeof aUsuario>[0] | null;
      if (!u?.id) return { ok: false as const, error: "No fue posible crear la cuenta." };
      await abrirSesion(u.id);
      return { ok: true as const, usuario: aUsuario(u) };
    } catch (e) {
      console.error("[registroEstudiante]", e);
      return { ok: false as const, error: "No fue posible crear la cuenta. Inténtalo nuevamente." };
    }
  });

/** Recibe el token de Google (vía Supabase Auth del proyecto), lo verifica y crea/usa la fila en `usuarios`. */
export const loginGoogle = createServerFn({ method: "POST" })
  .validator((d) => z.object({ accessToken: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { db, mensajeDeError } = await import("./cliente.server");
      const { abrirSesion, aUsuario } = await import("./sesion.server");
      const cliente = db();
      const { data: info, error } = await cliente.auth.getUser(data.accessToken);
      const email = info?.user?.email?.toLowerCase();
      const google = info?.user?.identities?.find((identity) => identity.provider === "google");
      if (error || !email || !google || !info.user?.email_confirmed_at || google.identity_data?.["email_verified"] !== true) {
        return { ok: false as const, error: "No se pudo verificar tu cuenta de Google." };
      }
      const columnas = "id, nombre, email, rol, tutor_id, activo, proveedor";
      const { data: existente, error: consultaError } = await cliente
        .from("usuarios")
        .select(columnas)
        .eq("email", email)
        .maybeSingle();
      if (consultaError) return { ok: false as const, error: mensajeDeError(consultaError, "No fue posible consultar tu cuenta.") };
      let u = existente;
      if (!u) {
        const nombre = String(info.user?.user_metadata?.["full_name"] ?? email.split("@")[0]).slice(0, 100);
        const r = await cliente
          .from("usuarios")
          .insert({ nombre, email, rol: "estudiante", proveedor: "google" })
          .select(columnas)
          .single();
        if (r.error) return { ok: false as const, error: mensajeDeError(r.error, "No fue posible crear tu cuenta.") };
        u = r.data;
      }
      if (!u.activo) return { ok: false as const, error: "Tu cuenta está desactivada." };
      // Seguridad: un correo de admin con contraseña (p. ej. admin@gmail.com) podría pertenecer a otra persona en Google.
      if (u.rol === "admin" && u.proveedor !== "google") {
        return { ok: false as const, error: "Las cuentas de administrador deben ingresar con correo y contraseña." };
      }
      await abrirSesion(u.id);
      return { ok: true as const, usuario: aUsuario(u) };
    } catch (e) {
      console.error("[loginGoogle]", e);
      return { ok: false as const, error: "No se pudo completar el acceso con Google." };
    }
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { cerrarSesionActual } = await import("./sesion.server");
    await cerrarSesionActual();
  } catch (e) {
    console.error("[logout]", e);
  }
  return { ok: true };
});

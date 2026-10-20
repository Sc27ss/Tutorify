import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { generarReferencia } from "@/data/tutoraula";
import { useServerFn } from "@tanstack/react-start";
import { MEET_LINK, TUTORES } from "@/data/tutoraula";
import * as authApi from "@/lib/externo/auth.functions";
import * as datosApi from "@/lib/externo/datos.functions";
import type { Resultado, Rol, Solicitud, Tarea, Usuario } from "@/lib/data/tipos";

export type { EstadoSolicitud, Rol, Solicitud, Tarea, Usuario } from "@/lib/data/tipos";

type Contexto = {
  listo: boolean;
  usuario: Usuario | null;
  solicitudes: Solicitud[];
  tareas: Tarea[];
  registrar: (datos: { nombre: string; email: string; password: string }) => Promise<Resultado>;
  iniciarSesion: (email: string, password: string) => Promise<Resultado<{ rol: Rol }>>;
  cerrarSesion: () => Promise<void>;
  crearSolicitud: (datos: {
    materia: string;
    plan: string;
    monto: number;
    dia: string;
    hora: string;
    metodo: string;
  }) => Promise<Resultado<{ referencia: string }>>;
  aprobarSolicitud: (id: string, tutorId: number) => Promise<void>;
  rechazarSolicitud: (id: string, nota?: string | undefined) => Promise<void>;
  crearTarea: (datos: {
    solicitudId: string;
    titulo: string;
    descripcion: string;
    entrega: string;
  }) => Promise<void>;
  marcarTarea: (id: string, estado: Tarea["estado"]) => Promise<void>;
  eliminarTarea: (id: string) => Promise<void>;
};

const AppContext = createContext<Contexto | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const usuarioRef = useRef<Usuario | null>(null);
  usuarioRef.current = usuario;

  const leerSesion = useServerFn(authApi.sesionActual);
  const leerDatos = useServerFn(datosApi.cargarDatos);
  const registro = useServerFn(authApi.registroEstudiante);
  const login = useServerFn(authApi.loginCorreo);
  const salir = useServerFn(authApi.logout);
  const compra = useServerFn(datosApi.crearSolicitud);
  const decidir = useServerFn(datosApi.decidirSolicitud);
  const nuevaTarea = useServerFn(datosApi.crearTarea);
  const cambiarTarea = useServerFn(datosApi.marcarTarea);
  const borrarTarea = useServerFn(datosApi.eliminarTarea);

  const refrescarDatos = useCallback(async (hayUsuario: boolean) => {
    if (!hayUsuario) { setSolicitudes([]); setTareas([]); return; }
    const datos = await leerDatos();
    setSolicitudes(datos.solicitudes);
    setTareas(datos.tareas);
  }, [leerDatos]);

  const sincronizar = useCallback(async () => {
    const perfil = await leerSesion();
    setUsuario(perfil);
    usuarioRef.current = perfil;
    await refrescarDatos(Boolean(perfil));
    return perfil;
  }, [leerSesion, refrescarDatos]);

  useEffect(() => {
    let activo = true;
    void sincronizar().catch(() => { setUsuario(null); }).finally(() => { if (activo) setListo(true); });
    return () => { activo = false; };
  }, [sincronizar]);

  const registrar = useCallback<Contexto["registrar"]>(async (datos) => {
    try {
      const resultado = await registro({ data: { ...datos, email: datos.email.trim().toLowerCase() } });
      if (!resultado.ok) return resultado;
      await sincronizar();
      return { ok: true };
    } catch { return { ok: false, error: "No fue posible crear la cuenta. Inténtalo nuevamente." }; }
  }, [registro, sincronizar]);

  const iniciarSesion = useCallback<Contexto["iniciarSesion"]>(async (email, password) => {
    try {
      const resultado = await login({ data: { email: email.trim().toLowerCase(), password } });
      if (!resultado.ok) return resultado;
      const perfil = await sincronizar();
      return perfil ? { ok: true, rol: perfil.rol } : { ok: false, error: "No fue posible cargar tu sesión." };
    } catch { return { ok: false, error: "No fue posible conectar con la base de datos. Inténtalo nuevamente." }; }
  }, [login, sincronizar]);

  const cerrarSesion = useCallback(async () => {
    await salir();
    setUsuario(null); usuarioRef.current = null;
    await refrescarDatos(false);
  }, [salir, refrescarDatos]);

  const crearSolicitud = useCallback<Contexto["crearSolicitud"]>(async (datos) => {
    if (usuarioRef.current?.rol !== "estudiante") return { ok: false, error: "Debes iniciar sesión como estudiante." };
    try {
      const referencia = generarReferencia();
      const resultado = await compra({ data: { ...datos, referencia } });
      if (!resultado.ok) return { ok: false, error: "No fue posible registrar el pago." };
      await refrescarDatos(true);
      return { ok: true, referencia };
    } catch { return { ok: false, error: "No fue posible registrar el pago." }; }
  }, [compra, refrescarDatos]);

  const aprobarSolicitud = useCallback<Contexto["aprobarSolicitud"]>(async (id, tutorId) => {
    await decidir({ data: { id, aprobar: true, tutorId, tutorNombre: TUTORES.find(t => t.id === tutorId)?.nombre, meet: MEET_LINK } });
    await refrescarDatos(true);
  }, [decidir, refrescarDatos]);
  const rechazarSolicitud = useCallback<Contexto["rechazarSolicitud"]>(async (id, nota) => {
    await decidir({ data: { id, aprobar: false, nota } }); await refrescarDatos(true);
  }, [decidir, refrescarDatos]);
  const crearTarea = useCallback<Contexto["crearTarea"]>(async (datos) => {
    await nuevaTarea({ data: datos }); await refrescarDatos(true);
  }, [nuevaTarea, refrescarDatos]);
  const marcarTarea = useCallback<Contexto["marcarTarea"]>(async (id, estado) => {
    await cambiarTarea({ data: { id, estado } }); await refrescarDatos(true);
  }, [cambiarTarea, refrescarDatos]);
  const eliminarTarea = useCallback<Contexto["eliminarTarea"]>(async (id) => {
    await borrarTarea({ data: { id } }); await refrescarDatos(true);
  }, [borrarTarea, refrescarDatos]);

  const valor = useMemo<Contexto>(
    () => ({
      listo,
      usuario,
      solicitudes,
      tareas,
      registrar,
      iniciarSesion,
      cerrarSesion,
      crearSolicitud,
      aprobarSolicitud,
      rechazarSolicitud,
      crearTarea,
      marcarTarea,
      eliminarTarea,
    }),
    [
      listo,
      usuario,
      solicitudes,
      tareas,
      registrar,
      iniciarSesion,
      cerrarSesion,
      crearSolicitud,
      aprobarSolicitud,
      rechazarSolicitud,
      crearTarea,
      marcarTarea,
      eliminarTarea,
    ],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp() {
  const contexto = useContext(AppContext);
  if (!contexto) throw new Error("useApp debe usarse dentro de AppProvider");
  return contexto;
}

export function rutaPanel(rol: Rol) {
  if (rol === "admin") return "/panel/admin" as const;
  if (rol === "tutor") return "/panel/tutor" as const;
  return "/panel/estudiante" as const;
}

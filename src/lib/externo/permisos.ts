import type { Rol } from "@/lib/data/tipos";

export function rolValido(rol: string): rol is Rol {
  return rol === "estudiante" || rol === "tutor" || rol === "admin";
}

export function protegeAccesoPropio(yo: string, id: string, rol?: Rol, activo?: boolean) {
  return yo === id && ((rol !== undefined && rol !== "admin") || activo === false);
}

export function puedeAccederSolicitud(
  usuario: { id: string; rol: string; tutor_id: number | null },
  solicitud: { estudiante_id: string; tutor_id: number | null },
  soloProfesor: boolean,
) {
  if (usuario.rol === "admin") return true;
  if (usuario.rol === "tutor") return usuario.tutor_id !== null && solicitud.tutor_id === usuario.tutor_id;
  return !soloProfesor && usuario.rol === "estudiante" && solicitud.estudiante_id === usuario.id;
}
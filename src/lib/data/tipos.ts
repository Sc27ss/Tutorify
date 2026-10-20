/** Tipos de dominio compartidos por la capa de datos y la interfaz. */

export type Rol = "estudiante" | "tutor" | "admin";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  tutorId?: number | undefined;
};

export type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada";

export type Solicitud = {
  id: string;
  referencia: string;
  estudianteId: string;
  estudianteNombre: string;
  materia: string;
  plan: string;
  monto: number;
  dia: string;
  hora: string;
  metodo: string;
  estado: EstadoSolicitud;
  tutorId?: number | undefined;
  tutorNombre?: string | undefined;
  meet?: string | undefined;
  creada: string;
  nota?: string | undefined;
};

export type Tarea = {
  id: string;
  solicitudId: string;
  titulo: string;
  descripcion: string;
  entrega: string;
  estado: "pendiente" | "entregada";
};

export type Resultado<T = unknown> = {
  ok: boolean;
  error?: string | undefined;
} & Partial<T>;

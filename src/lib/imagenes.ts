/** Imágenes alojadas en Imgur que reemplazan a los emojis de la interfaz. */
const I = (id: string) => `https://i.imgur.com/${id}.png`;

export const LOGO = I("PQYDozr");
export const MASCOTA = I("AWki9pL");

export const MATERIA_IMG: Record<string, string> = {
  "Cálculo": I("to30dXt"),
  "Física": I("20jg4kv"),
  "Química": I("mnmmP6v"),
  "Matemáticas": I("x4o7vR3"),
  "Lectura Crítica": I("7JTwfdb"),
  "Biología": I("t6eih6J"),
};

export function iconoMateria(nombre: string): string | undefined {
  return MATERIA_IMG[nombre];
}

export const FAQ_IMG = [
  I("kHbCUQe"), // cómo funciona el pago
  I("oRvSemx"), // quién elige
  I("NoRoYWC"), // dónde se dictan
  I("w55lTxS"), // las tutorías incluyen
  I("XXJkXFE"), // Tutorify solo funciona
  I("2kOHzq2"), // puedo cambiar
];

export const EQUIPO_BOTON = I("x29DBWu");
export const EQUIPO_IMG: Record<string, string> = {
  santiago: I("G0tRStC"),
  damian: I("ZeQiQpH"),
  andres: I("PNFPTSb"),
  neita: I("PNFPTSb"),
};

export const TERMINOS_IMG = [
  I("iNG7OP0"),
  I("2oM9flP"),
  I("gKh6eTG"),
  I("EJhrJVm"),
  I("uafpKqx"),
  I("o3tMK6C"),
  I("qMjvwYq"),
  I("FUaExyr"),
];

export const PANEL_IMG = {
  salir: I("4WIQJeA"),
  // Admin
  adminComprasTotales: I("WTaNIpz"),
  adminPendientes: I("pjb9Aav"),
  adminIngresos: I("OEc3Uwb"),
  adminTareasActivas: I("7XQTKi8"),
  adminCompras: I("QrLjfN8"),
  adminEquipo: I("x29DBWu"),
  adminUsuarios: I("2oM9flP"),
  adminTareas: I("iNG7OP0"),
  // Profesor
  tutorEstudiantes: I("logxAsK"),
  tutorTareas: I("PXP1ybW"),
  tutorEntregadas: I("jd1yhLs"),
  tutorResumen: I("vYvrZF3"),
  // Estudiante
  estCompras: I("QrLjfN8"),
  estClasesActivas: I("bFDPuFz"),
  estTareasPendientes: I("TOTjufP"),
  estResumen: I("kOLJ7nA"),
  estTutorias: I("bFDPuFz"),
  estTareas: I("yRPxTfW"),
} as const;

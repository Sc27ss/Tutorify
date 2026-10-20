export type Nivel = "primaria" | "bachillerato" | "icfes" | "universidad";

export type Tutor = {
  id: number;
  nombre: string;
  ciudad: string;
  nivel: Nivel;
  titulo: string;
  biografia: string;
  precioHora: number;
  calificacion: number;
  totalResenas: number;
  materias: string[];
  dias: string[];
  horas: string[];
};

export type Resena = {
  estudiante: string;
  tutor: string;
  puntuacion: number;
  comentario: string;
};

export const MARCA = "Tutorify";

export const CIUDAD = "Medellín, Colombia";

export const MEET_LINK = "https://meet.google.com/dbz-nmbp-gyd";

import { MATERIA_IMG } from "@/lib/imagenes";

export type ColorMateria = "mint" | "sun" | "royal" | "grape" | "ocre";

export const PALETA_MATERIA: Record<
  ColorMateria,
  { fondo: string; suave: string; texto: string; borde: string; chip: string }
> = {
  mint: {
    fondo: "bg-mint",
    suave: "bg-mint/12",
    texto: "text-mint-deep",
    borde: "border-mint-deep/40",
    chip: "bg-mint/20 text-mint-deep",
  },
  sun: {
    fondo: "bg-sun",
    suave: "bg-sun/15",
    texto: "text-amber-ocre",
    borde: "border-amber-ocre/40",
    chip: "bg-sun/25 text-amber-ocre",
  },
  royal: {
    fondo: "bg-royal",
    suave: "bg-royal/10",
    texto: "text-royal",
    borde: "border-royal/35",
    chip: "bg-royal/12 text-royal",
  },
  grape: {
    fondo: "bg-grape",
    suave: "bg-grape/10",
    texto: "text-grape-deep",
    borde: "border-grape/35",
    chip: "bg-grape/15 text-grape-deep",
  },
  ocre: {
    fondo: "bg-amber-ocre",
    suave: "bg-amber-ocre/12",
    texto: "text-amber-ocre",
    borde: "border-amber-ocre/40",
    chip: "bg-amber-ocre/15 text-amber-ocre",
  },
};

export const MATERIAS_DESTACADAS: {
  nombre: string;
  icono: string;
  color: ColorMateria;
  descripcion: string;
  temas: string[];
}[] = [
  {
    nombre: "Cálculo",
    icono: MATERIA_IMG["Cálculo"]!,
    color: "mint",
    descripcion: "Límites, derivadas e integrales explicadas paso a paso.",
    temas: ["Límites", "Derivadas", "Integrales", "Series"],
  },
  {
    nombre: "Física",
    icono: MATERIA_IMG["Física"]!,
    color: "sun",
    descripcion: "Mecánica, ondas y electricidad con problemas tipo examen.",
    temas: ["Cinemática", "Dinámica", "Energía", "Electricidad"],
  },
  {
    nombre: "Química",
    icono: MATERIA_IMG["Química"]!,
    color: "grape",
    descripcion: "Desde la tabla periódica hasta estequiometría y orgánica.",
    temas: ["Enlaces", "Estequiometría", "Soluciones", "Orgánica"],
  },
  {
    nombre: "Matemáticas",
    icono: MATERIA_IMG["Matemáticas"]!,
    color: "mint",
    descripcion: "Álgebra, trigonometría y geometría con práctica guiada.",
    temas: ["Álgebra", "Trigonometría", "Geometría", "Funciones"],
  },
  {
    nombre: "Lectura Crítica",
    icono: MATERIA_IMG["Lectura Crítica"]!,
    color: "royal",
    descripcion: "Comprensión, argumentación y estrategias Saber 11.",
    temas: ["Inferencia", "Argumentos", "Vocabulario", "Simulacros"],
  },
  {
    nombre: "Biología",
    icono: MATERIA_IMG["Biología"]!,
    color: "ocre",
    descripcion: "Célula, genética y ecología con material visual.",
    temas: ["Célula", "Genética", "Ecología", "Evolución"],
  },
];

export function colorMateria(nombre: string): ColorMateria {
  return MATERIAS_DESTACADAS.find((m) => m.nombre === nombre)?.color ?? "mint";
}


export const MATERIAS = MATERIAS_DESTACADAS.map((m) => m.nombre);

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const HORAS = ["08:00", "10:00", "14:00", "16:00", "18:00"];

/** Horas de inicio que el administrador puede asignar a un profesor (de 6:00 a. m. a 9:00 p. m.). */
export const HORAS_TUTOR = Array.from({ length: 16 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);

export const NIVELES: { valor: Nivel; etiqueta: string }[] = [
  { valor: "primaria", etiqueta: "Primaria" },
  { valor: "bachillerato", etiqueta: "Bachillerato" },
  { valor: "icfes", etiqueta: "Preparación ICFES" },
  { valor: "universidad", etiqueta: "Universidad" },
];

export const TUTORES: Tutor[] = [
  {
    id: 1,
    nombre: "Laura Gómez",
    ciudad: "Medellín",
    nivel: "universidad",
    titulo: "Magíster en Matemáticas",
    biografia: "Diez años enseñando cálculo y matemáticas a grado 11 y primeros semestres.",
    precioHora: 45000,
    calificacion: 4.9,
    totalResenas: 132,
    materias: ["Cálculo", "Matemáticas"],
    dias: ["Lunes", "Miércoles", "Viernes"],
    horas: ["08:00", "10:00", "16:00"],
  },
  {
    id: 2,
    nombre: "Carlos Ramírez",
    ciudad: "Medellín",
    nivel: "bachillerato",
    titulo: "Ingeniero Físico",
    biografia: "Física y matemáticas con método de resolución de problemas tipo ICFES.",
    precioHora: 38000,
    calificacion: 4.7,
    totalResenas: 88,
    materias: ["Física", "Matemáticas"],
    dias: ["Martes", "Jueves", "Sábado"],
    horas: ["10:00", "14:00", "18:00"],
  },
  {
    id: 3,
    nombre: "Ana Torres",
    ciudad: "Medellín",
    nivel: "icfes",
    titulo: "Licenciada en Química",
    biografia: "Química, biología y lectura crítica enfocadas en las pruebas Saber 11.",
    precioHora: 30000,
    calificacion: 4.8,
    totalResenas: 61,
    materias: ["Química", "Biología", "Lectura Crítica"],
    dias: ["Lunes", "Martes", "Jueves", "Sábado"],
    horas: ["08:00", "14:00", "18:00"],
  },
];

export const RESENAS: Resena[] = [
  {
    estudiante: "Sofía Herrera",
    tutor: "Laura Gómez",
    puntuacion: 5,
    comentario: "Laura explica el cálculo con ejemplos clarísimos. Pasé de 2.8 a 4.5 en el periodo.",
  },
  {
    estudiante: "Julián Castro",
    tutor: "Carlos Ramírez",
    puntuacion: 5,
    comentario: "Excelente preparación en física, muy puntual y organizado con las guías.",
  },
  {
    estudiante: "Valentina Ríos",
    tutor: "Ana Torres",
    puntuacion: 4,
    comentario: "Química dejó de ser mi materia imposible. Los simulacros ayudan muchísimo.",
  },
];

export const PLANES = [
  {
    nombre: "Clase Individual",
    precio: 45000,
    unidad: "/hora",
    destacado: false,
    beneficios: [
      "1 hora de tutoría en vivo",
      "Sala virtual incluida",
      "Material de apoyo digital",
      "Reprogramación con 12 horas",
    ],
  },
  {
    nombre: "Pack Estudiante",
    precio: 380000,
    unidad: "/10 horas",
    destacado: true,
    beneficios: [
      "10 horas con el mismo tutor",
      "Ahorro del 15%",
      "Plan de estudio personalizado",
      "Informe mensual de avance",
    ],
  },
  {
    nombre: "Plan Exámenes / ICFES",
    precio: 690000,
    unidad: "/20 horas",
    destacado: false,
    beneficios: [
      "20 horas intensivas",
      "Simulacros calificados",
      "Tutores especializados Saber 11",
      "Seguimiento semanal a acudientes",
    ],
  },
];

export function formatearPrecio(valor: number) {
  return `$${valor.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

export function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((parte) => parte.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function estrellas(nota: number) {
  const llenas = Math.round(nota);
  return "★★★★★".slice(0, llenas) + "☆☆☆☆☆".slice(0, 5 - llenas);
}

export function generarReferencia() {
  return `TF-2026-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

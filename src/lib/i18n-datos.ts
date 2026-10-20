/**
 * Traducciones al inglés de los DATOS de la plataforma (materias, días, planes, estados…).
 * Los valores guardados en la base de datos siguen en español; esto solo cambia lo que se MUESTRA.
 */
export const DATOS_EN: Record<string, string> = {
  // Materias
  Cálculo: "Calculus",
  Física: "Physics",
  Química: "Chemistry",
  Matemáticas: "Mathematics",
  "Lectura Crítica": "Critical Reading",
  Biología: "Biology",

  // Descripciones de materias
  "Límites, derivadas e integrales explicadas paso a paso.": "Limits, derivatives and integrals explained step by step.",
  "Mecánica, ondas y electricidad con problemas tipo examen.": "Mechanics, waves and electricity with exam-style problems.",
  "Desde la tabla periódica hasta estequiometría y orgánica.": "From the periodic table to stoichiometry and organic chemistry.",
  "Álgebra, trigonometría y geometría con práctica guiada.": "Algebra, trigonometry and geometry with guided practice.",
  "Comprensión, argumentación y estrategias Saber 11.": "Comprehension, argumentation and Saber 11 strategies.",
  "Célula, genética y ecología con material visual.": "Cell biology, genetics and ecology with visual material.",

  // Temas
  Límites: "Limits",
  Derivadas: "Derivatives",
  Integrales: "Integrals",
  Series: "Series",
  Cinemática: "Kinematics",
  Dinámica: "Dynamics",
  Energía: "Energy",
  Electricidad: "Electricity",
  Enlaces: "Bonds",
  Estequiometría: "Stoichiometry",
  Soluciones: "Solutions",
  Orgánica: "Organic",
  Álgebra: "Algebra",
  Trigonometría: "Trigonometry",
  Geometría: "Geometry",
  Funciones: "Functions",
  Inferencia: "Inference",
  Argumentos: "Arguments",
  Vocabulario: "Vocabulary",
  Simulacros: "Mock exams",
  Célula: "Cell",
  Genética: "Genetics",
  Ecología: "Ecology",
  Evolución: "Evolution",

  // Días
  Lunes: "Monday",
  Martes: "Tuesday",
  Miércoles: "Wednesday",
  Jueves: "Thursday",
  Viernes: "Friday",
  Sábado: "Saturday",

  // Tutores
  "Magíster en Matemáticas": "Master's in Mathematics",
  "Ingeniero Físico": "Engineering Physicist",
  "Licenciada en Química": "Chemistry Teaching Degree",
  "Diez años enseñando cálculo y matemáticas a grado 11 y primeros semestres.":
    "Ten years teaching calculus and mathematics to 11th graders and first-year university students.",
  "Física y matemáticas con método de resolución de problemas tipo ICFES.":
    "Physics and mathematics with an ICFES-style problem-solving method.",
  "Química, biología y lectura crítica enfocadas en las pruebas Saber 11.":
    "Chemistry, biology and critical reading focused on the Saber 11 exams.",

  // Reseñas
  "Laura explica el cálculo con ejemplos clarísimos. Pasé de 2.8 a 4.5 en el periodo.":
    "Laura explains calculus with crystal-clear examples. I went from 2.8 to 4.5 this term.",
  "Excelente preparación en física, muy puntual y organizado con las guías.":
    "Excellent physics preparation, very punctual and well organized with the study guides.",
  "Química dejó de ser mi materia imposible. Los simulacros ayudan muchísimo.":
    "Chemistry stopped being my impossible subject. The mock exams help a lot.",

  // Planes
  "Clase Individual": "Single Class",
  "Pack Estudiante": "Student Pack",
  "Plan Exámenes / ICFES": "Exams / ICFES Plan",
  "/hora": "/hour",
  "/10 horas": "/10 hours",
  "/20 horas": "/20 hours",
  "1 hora de tutoría en vivo": "1 hour of live tutoring",
  "Sala virtual incluida": "Virtual classroom included",
  "Material de apoyo digital": "Digital study material",
  "Reprogramación con 12 horas": "Reschedule with 12 hours' notice",
  "10 horas con el mismo tutor": "10 hours with the same tutor",
  "Ahorro del 15%": "15% savings",
  "Plan de estudio personalizado": "Personalized study plan",
  "Informe mensual de avance": "Monthly progress report",
  "20 horas intensivas": "20 intensive hours",
  "Simulacros calificados": "Graded mock exams",
  "Tutores especializados Saber 11": "Saber 11 specialist tutors",
  "Seguimiento semanal a acudientes": "Weekly updates for parents/guardians",

  // Estados y filtros
  pendiente: "pending",
  aprobada: "approved",
  rechazada: "rejected",
  entregada: "submitted",
  todas: "all",

  // Métodos de pago
  tarjeta: "card",
  pse: "PSE",
  nequi: "Nequi",
  daviplata: "Daviplata",

  // Mensajes de error del servidor y del almacén de datos
  "La base de datos no responde. ¿Ejecutaste el SQL?": "The database isn't responding. Did you run the SQL?",
  "Correo o contraseña incorrectos.": "Incorrect email or password.",
  "Tu cuenta está desactivada.": "Your account is disabled.",
  "No se pudo verificar tu cuenta de Google.": "We couldn't verify your Google account.",
  "No fue posible consultar tu cuenta.": "We couldn't look up your account.",
  "No fue posible crear tu cuenta.": "We couldn't create your account.",
  "Las cuentas de administrador deben ingresar con correo y contraseña.": "Administrator accounts must log in with email and password.",
  "No fue posible crear la cuenta. Inténtalo nuevamente.": "We couldn't create the account. Please try again.",
  "No fue posible crear la cuenta.": "We couldn't create the account.",
  "No fue posible conectar con la base de datos. Inténtalo nuevamente.": "We couldn't connect to the database. Please try again.",
  "No fue posible cargar tu sesión.": "We couldn't load your session.",
  "No fue posible iniciar sesión.": "We couldn't log you in.",
  "Debes iniciar sesión como estudiante.": "You must log in as a student.",
  "No fue posible registrar el pago.": "We couldn't register the payment.",
  "Ese correo ya tiene una cuenta registrada.": "That email already has a registered account.",
  "Ese correo ya existe.": "That email already exists.",
  "No se pudo crear.": "Couldn't create it.",
  "No puedes quitarte tu propio acceso de administrador.": "You can't remove your own administrator access.",
  "No se pudo actualizar el usuario.": "Couldn't update the user.",
  "No se pudo cambiar la contraseña.": "Couldn't change the password.",
  "No se pudieron cerrar las sesiones anteriores.": "Couldn't close the previous sessions.",
  "No puedes eliminar tu propia cuenta.": "You can't delete your own account.",
  "No se pudo eliminar el usuario.": "Couldn't delete the user.",

  // Notas generadas por el sistema
  "Pago no validado por la administración.": "Payment not validated by the administration.",
  "Compra rechazada.": "Purchase rejected.",
};

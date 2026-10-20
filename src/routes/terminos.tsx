import { Link, createFileRoute } from "@tanstack/react-router";

import { CIUDAD, MARCA, MEET_LINK } from "@/data/tutoraula";
import { useI18n } from "@/lib/preferencias";
import { TERMINOS_IMG } from "@/lib/imagenes";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y condiciones | Tutorify" },
      {
        name: "description",
        content:
          "Condiciones de uso, política de pagos, reembolsos, conducta y privacidad de la plataforma de tutorías Tutorify en Medellín, Colombia.",
      },
      { property: "og:title", content: "Términos y condiciones | Tutorify" },
      {
        property: "og:description",
        content: "Reglas de uso, pagos, reembolsos y privacidad de Tutorify.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terminos,
});

const SECCIONES: { titulo: string; icono: string; parrafos: string[] }[] = [
  {
    titulo: "1. Aceptación de los términos",
    icono: TERMINOS_IMG[0]!,
    parrafos: [
      `Al crear una cuenta, agendar una tutoría o realizar un pago en ${MARCA} aceptas íntegramente estas condiciones. Si no estás de acuerdo con alguna de ellas, debes abstenerte de usar la plataforma.`,
      `${MARCA} opera desde ${CIUDAD} y sus servicios se rigen por la legislación colombiana vigente, incluida la Ley 1581 de 2012 sobre protección de datos personales y el Estatuto del Consumidor (Ley 1480 de 2011).`,
    ],
  },
  {
    titulo: "2. Cuentas de usuario",
    icono: TERMINOS_IMG[1]!,
    parrafos: [
      "El registro público en la plataforma crea únicamente cuentas de estudiante. Las cuentas de profesor y de administración son creadas y verificadas internamente por Tutorify; ningún usuario puede auto-registrarse como tutor.",
      "Los menores de edad deben contar con la autorización de su padre, madre o acudiente, quien será responsable de los pagos y del uso del servicio.",
      "Eres responsable de la confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta.",
    ],
  },
  {
    titulo: "3. Compras, pagos y aprobación",
    icono: TERMINOS_IMG[2]!,
    parrafos: [
      "Toda compra queda registrada con una referencia única y en estado PENDIENTE hasta que el equipo administrativo verifique el pago.",
      "Una vez aprobada la compra, la administración asigna un profesor compatible con la materia, el día y la hora seleccionados, y habilita el enlace de la clase.",
      "Si el pago no puede validarse, la compra se marca como RECHAZADA con la nota correspondiente y el estudiante puede reintentarlo sin costo adicional.",
      "Los precios se expresan en pesos colombianos (COP) e incluyen los impuestos aplicables.",
    ],
  },
  {
    titulo: "4. Clases, reprogramación y reembolsos",
    icono: TERMINOS_IMG[3]!,
    parrafos: [
      `Las clases se realizan en línea a través de la sala virtual (${MEET_LINK}). Se recomienda conectarse cinco minutos antes.`,
      "Puedes reprogramar una sesión avisando con al menos 12 horas de anticipación. Las inasistencias sin aviso se consideran clase dictada.",
      "Si el profesor no se presenta, la sesión se reprograma sin costo o se reembolsa el 100% del valor de esa clase dentro de los 10 días hábiles siguientes.",
      "El derecho de retracto aplica dentro de los 5 días hábiles siguientes a la compra, siempre que no se haya tomado la primera clase.",
    ],
  },
  {
    titulo: "5. Conducta y uso aceptable",
    icono: TERMINOS_IMG[4]!,
    parrafos: [
      "Está prohibido grabar, difundir o comercializar el contenido de las clases sin autorización escrita de las partes involucradas.",
      "No se tolera acoso, discriminación, lenguaje ofensivo ni suplantación de identidad. El incumplimiento implica la suspensión inmediata de la cuenta.",
      "Tutorify acompaña el aprendizaje: no se realizan trabajos, exámenes ni evaluaciones en lugar del estudiante.",
    ],
  },
  {
    titulo: "6. Tareas y material académico",
    icono: TERMINOS_IMG[5]!,
    parrafos: [
      "El material compartido por los profesores es para uso personal y académico del estudiante asignado.",
      "Las tareas registradas en la plataforma tienen fecha de entrega orientativa; el estudiante puede marcarlas como entregadas desde su panel.",
    ],
  },
  {
    titulo: "7. Datos personales y privacidad",
    icono: TERMINOS_IMG[6]!,
    parrafos: [
      "Recolectamos nombre, correo y datos de la compra con la única finalidad de prestar el servicio, asignar profesor y soportar la facturación.",
      "No vendemos ni cedemos datos personales a terceros con fines publicitarios.",
      "Puedes solicitar el acceso, corrección o eliminación de tus datos escribiendo a hola@tutorify.co.",
    ],
  },
  {
    titulo: "8. Responsabilidad y cambios",
    icono: TERMINOS_IMG[7]!,
    parrafos: [
      "Tutorify no se hace responsable por fallas de conectividad ajenas a la plataforma ni por los resultados académicos, que dependen del compromiso del estudiante.",
      "Podemos actualizar estos términos; la versión vigente siempre estará publicada en esta página con su fecha de actualización.",
    ],
  },
];

const SECCIONES_EN: { titulo: string; parrafos: string[] }[] = [
  {
    titulo: "1. Acceptance of terms",
    parrafos: [
      `By creating an account, booking a tutoring session or making a payment on ${MARCA} you fully accept these conditions. If you disagree with any of them, you must refrain from using the platform.`,
      `${MARCA} operates from ${CIUDAD} and its services are governed by current Colombian law, including Law 1581 of 2012 on personal data protection and the Consumer Statute (Law 1480 of 2011).`,
    ],
  },
  {
    titulo: "2. User accounts",
    parrafos: [
      `Public sign-up on the platform only creates student accounts. Teacher and administration accounts are created and verified internally by Tutorify; no user can self-register as a tutor.`,
      `Minors must have the authorization of their parent or guardian, who will be responsible for payments and use of the service.`,
      `You are responsible for keeping your password confidential and for all activity carried out from your account.`,
    ],
  },
  {
    titulo: "3. Purchases, payments and approval",
    parrafos: [
      `Every purchase is recorded with a unique reference and in PENDING status until the administrative team verifies the payment.`,
      `Once the purchase is approved, the administration assigns a teacher compatible with the selected subject, day and time, and enables the class link.`,
      `If the payment can't be validated, the purchase is marked as REJECTED with the corresponding note and the student may try again at no additional cost.`,
      `Prices are expressed in Colombian pesos (COP) and include applicable taxes.`,
    ],
  },
  {
    titulo: "4. Classes, rescheduling and refunds",
    parrafos: [
      `Classes take place online through the virtual room (${MEET_LINK}). We recommend connecting five minutes early.`,
      `You can reschedule a session by giving at least 12 hours' notice. No-shows without notice are considered a delivered class.`,
      `If the teacher doesn't show up, the session is rescheduled at no cost or 100% of that class's price is refunded within the following 10 business days.`,
      `The right of withdrawal applies within 5 business days after the purchase, as long as the first class hasn't been taken.`,
    ],
  },
  {
    titulo: "5. Conduct and acceptable use",
    parrafos: [
      `Recording, distributing or selling the content of classes without written authorization from the parties involved is prohibited.`,
      `Harassment, discrimination, offensive language and identity impersonation are not tolerated. Violations result in immediate account suspension.`,
      `Tutorify supports learning: no assignments, exams or assessments are completed in place of the student.`,
    ],
  },
  {
    titulo: "6. Homework and academic material",
    parrafos: [
      `Material shared by teachers is for the personal and academic use of the assigned student.`,
      `Homework recorded on the platform has a guideline due date; students can mark it as submitted from their dashboard.`,
    ],
  },
  {
    titulo: "7. Personal data and privacy",
    parrafos: [
      `We collect name, email and purchase data solely to provide the service, assign a teacher and support billing.`,
      `We do not sell or transfer personal data to third parties for advertising purposes.`,
      `You can request access to, correction of or deletion of your data by writing to hola@tutorify.co.`,
    ],
  },
  {
    titulo: "8. Liability and changes",
    parrafos: [
      `Tutorify is not responsible for connectivity failures outside the platform or for academic results, which depend on the student's commitment.`,
      `We may update these terms; the current version will always be published on this page with its update date.`,
    ],
  },
];

function Terminos() {
  const { t, idioma } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="hero-surface dotted-surface border-b-2 border-border">
        <div className="mx-auto w-[92%] max-w-3xl py-16">
          <Link
            to="/"
            className="chunky inline-block rounded-2xl border border-border bg-card px-4 py-2 font-ui text-xs font-bold "
          >
            <span aria-hidden="true">←</span> {t("Volver al inicio", "Back to home")}
          </Link>
          <p className="mt-8 font-ui text-xs font-bold tracking-normal text-mint-deep">
            Legal · {CIUDAD}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
            {idioma === "en" ? (
              <>
                Terms and <span className="text-gradient-animated">conditions</span>
              </>
            ) : (
              <>
                Términos y <span className="text-gradient-animated">condiciones</span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {t(
              "Reglas claras para que estudiantes, acudientes y profesores sepan exactamente qué esperar de Tutorify. Última actualización: agosto de 2026.",
              "Clear rules so students, guardians and teachers know exactly what to expect from Tutorify. Last updated: August 2026.",
            )}
          </p>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto w-[92%] max-w-3xl py-14 outline-none">
        <div className="flex flex-col gap-5">
          {SECCIONES.map((seccion, indice) => {
            const texto = idioma === "en" ? SECCIONES_EN[indice]! : seccion;
            return (
            <article
              key={seccion.titulo}
              className="chunky-lift rounded-4xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <img src={seccion.icono} alt="" aria-hidden="true" loading="lazy" className="size-12 shrink-0 object-contain" />
                <h2 className="font-display text-lg font-bold">{texto.titulo}</h2>
              </div>
              <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                {texto.parrafos.map((parrafo) => (
                  <p key={parrafo}>{parrafo}</p>
                ))}
              </div>
            </article>
            );
          })}
        </div>

        <p className="mt-10 rounded-4xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
          {t("¿Dudas sobre estas condiciones? Escríbenos a", "Questions about these terms? Write to us at")} <strong>hola@tutorify.co</strong> · {CIUDAD}
        </p>
      </main>
    </div>
  );
}

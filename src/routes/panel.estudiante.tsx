import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { MEET_LINK, colorMateria, formatearPrecio, PALETA_MATERIA } from "@/data/tutoraula";
import {
  EstadoChip,
  GuardiaPanel,
  PanelShell,
  SeccionPanel,
  Tarjeta,
  Vacio,
  botonPrimario,
  botonSecundario,
} from "@/components/panel";
import { PANEL_IMG, iconoMateria } from "@/lib/imagenes";
import { Icono } from "@/components/icono-img";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/preferencias";

export const Route = createFileRoute("/panel/estudiante")({
  head: () => ({
    meta: [
      { title: "Mi panel de estudiante | Tutorify" },
      {
        name: "description",
        content: "Consulta el estado de tus compras, tu tutor asignado, tus tareas y el enlace de tu clase.",
      },
      { property: "og:title", content: "Mi panel de estudiante | Tutorify" },
      { property: "og:description", content: "Compras, tutor asignado, tareas y sala virtual en Tutorify." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <GuardiaPanel rol="estudiante">
      <PanelEstudiante />
    </GuardiaPanel>
  ),
});

function PanelEstudiante() {
  const { usuario, solicitudes, tareas, marcarTarea } = useApp();
  const { t, tr } = useI18n();

  const mias = useMemo(
    () => solicitudes.filter((s) => s.estudianteId === usuario?.id),
    [solicitudes, usuario?.id],
  );
  const misTareas = useMemo(
    () => tareas.filter((x) => mias.some((s) => s.id === x.solicitudId)),
    [tareas, mias],
  );
  const aprobadas = mias.filter((s) => s.estado === "aprobada");
  const hechas = misTareas.filter((x) => x.estado === "entregada").length;
  const progreso = misTareas.length ? Math.round((hechas / misTareas.length) * 100) : 0;

  return (
    <PanelShell rol="estudiante">
      <section id="resumen" className="scroll-mt-24">
        <div className="hero-surface dotted-surface rounded-4xl border border-border p-8 shadow-soft">
          <p className="font-ui text-xs font-bold tracking-normal text-mint-deep">
            {t("¡Buen día para aprender!", "A great day to learn!")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {t("Hola", "Hello")}, {usuario?.nombre} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {t(
              "Aquí vive tu ruta de estudio: tus clases, tu profesor asignado y las tareas que te ponen.",
              "This is your study path: your classes, your assigned teacher and the homework you are given.",
            )}
          </p>

          <div className="mt-6 max-w-md">
            <div className="flex items-center justify-between font-ui text-xs font-bold ">
              <span id="progreso-tareas">{t("Progreso de tareas", "Homework progress")}</span>
              <span className="text-mint-deep">{progreso}%</span>
            </div>
            <div
              role="progressbar"
              aria-labelledby="progreso-tareas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progreso}
              className="mt-2 h-4 w-full overflow-hidden rounded-full border border-border bg-card"
            >
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-700"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Tarjeta titulo={t("Compras", "Purchases")} valor={String(mias.length)} detalle={t("Solicitudes registradas", "Registered requests")} icono={PANEL_IMG.estCompras} tono="grape" />
          <Tarjeta titulo={t("Clases activas", "Active classes")} valor={String(aprobadas.length)} detalle={t("Con tutor asignado", "With an assigned tutor")} icono={PANEL_IMG.estClasesActivas} tono="mint" />
          <Tarjeta
            titulo={t("Tareas pendientes", "Pending homework")}
            valor={String(misTareas.filter((x) => x.estado === "pendiente").length)}
            icono={PANEL_IMG.estTareasPendientes}
            tono="sun"
          />
        </div>
      </section>

      <SeccionPanel
        id="tutorias"
        titulo={t("Mis tutorías", "My tutoring")}
        descripcion={t("Estado de cada compra y acceso a tu sala.", "Status of each purchase and access to your classroom.")}
      >
        {mias.length === 0 ? (
          <Vacio
            icono="🔍"
            texto={t("Aún no has agendado ninguna tutoría.", "You have not booked any tutoring yet.")}
            extra={
              <Link to="/" className={`${botonPrimario} mt-5 inline-block`}>
                {t("Buscar un tutor", "Find a tutor")}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {mias.map((solicitud) => {
              const paleta = PALETA_MATERIA[colorMateria(solicitud.materia)];
              return (
                <article
                  key={solicitud.id}
                  className={`chunky-lift rounded-4xl border bg-card p-6 shadow-soft ${paleta.borde}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-12 place-items-center rounded-2xl text-xl text-foreground ${paleta.fondo}`}
                      >
                        {iconoMateria(solicitud.materia) ? <Icono src={iconoMateria(solicitud.materia)!} className="size-9" /> : <span aria-hidden="true">🎓</span>}
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-bold">{tr(solicitud.materia)}</h3>
                        <p className="text-xs text-muted-foreground">
                          {tr(solicitud.plan)} · {tr(solicitud.dia)} {solicitud.hora}
                        </p>
                      </div>
                    </div>
                    <EstadoChip estado={solicitud.estado} />
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("Referencia", "Reference")} <strong>{solicitud.referencia}</strong> · {formatearPrecio(solicitud.monto)} ·{" "}
                    {tr(solicitud.metodo)}
                  </p>

                  {solicitud.estado === "pendiente" && (
                    <p className="mt-4 rounded-2xl bg-sun/15 p-4 text-xs text-amber-ocre">
                      {t(
                        "Tu pago está en revisión. Cuando el administrador lo apruebe se te asignará un profesor.",
                        "Your payment is under review. Once the administrator approves it, a teacher will be assigned to you.",
                      )}
                    </p>
                  )}
                  {solicitud.estado === "rechazada" && (
                    <p className="mt-4 rounded-2xl bg-destructive/10 p-4 text-xs text-destructive">
                      {solicitud.nota ? tr(solicitud.nota) : t("El pago no pudo ser validado. Contáctanos para reintentarlo.", "The payment could not be validated. Contact us to try again.")}
                    </p>
                  )}
                  {solicitud.estado === "aprobada" && (
                    <div className="mt-4 rounded-3xl border border-mint-deep/30 bg-mint/10 p-4">
                      <p className="font-ui text-sm font-bold text-mint-deep">
                        {t("Profesor asignado", "Assigned teacher")}: {solicitud.tutorNombre}
                      </p>
                      <a
                        href={solicitud.meet ?? MEET_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className={`${botonPrimario} animate-live-pulse mt-3 inline-block`}
                      >
                        {t("Entrar a la clase (Meet)", "Join the class (Meet)")}
                        <span className="sr-only"> {t("(se abre en una pestaña nueva)", "(opens in a new tab)")}</span>
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </SeccionPanel>

      <SeccionPanel
        id="tareas"
        titulo={t("Mis tareas", "My homework")}
        descripcion={t("Marca como entregada cuando termines.", "Mark it as submitted when you finish.")}
      >
        {misTareas.length === 0 ? (
          <Vacio icono="📭" texto={t("Tu profesor aún no te ha asignado tareas.", "Your teacher has not assigned you any homework yet.")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {misTareas.map((tarea) => (
              <li
                key={tarea.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Icono src={PANEL_IMG.estTareas} className="size-11 shrink-0" />
                  <div>
                    <p className="font-display font-bold">{tarea.titulo}</p>
                    <p className="text-sm text-muted-foreground">{tarea.descripcion}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("Entrega", "Due")}: {tarea.entrega || t("sin fecha", "no date")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <EstadoChip estado={tarea.estado} />
                  {tarea.estado === "pendiente" && (
                    <button onClick={() => marcarTarea(tarea.id, "entregada")} className={botonSecundario}>
                      {t("Marcar entregada", "Mark as submitted")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SeccionPanel>
    </PanelShell>
  );
}

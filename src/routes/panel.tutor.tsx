import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";

import { MEET_LINK, PALETA_MATERIA, colorMateria, formatearPrecio } from "@/data/tutoraula";
import {
  EstadoChip,
  GuardiaPanel,
  PanelShell,
  SeccionPanel,
  Tarjeta,
  Vacio,
  botonPrimario,
  botonSecundario,
  inputPanel,
} from "@/components/panel";
import { PANEL_IMG } from "@/lib/imagenes";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/preferencias";

export const Route = createFileRoute("/panel/tutor")({
  head: () => ({
    meta: [
      { title: "Panel del profesor | Tutorify" },
      {
        name: "description",
        content: "Gestiona tus estudiantes asignados, asigna tareas y abre la sala de clase en Google Meet.",
      },
      { property: "og:title", content: "Panel del profesor | Tutorify" },
      { property: "og:description", content: "Estudiantes asignados, tareas y sala virtual del profesor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <GuardiaPanel rol="tutor">
      <PanelTutor />
    </GuardiaPanel>
  ),
});

function PanelTutor() {
  const { usuario, solicitudes, tareas, crearTarea, marcarTarea, eliminarTarea } = useApp();
  const { t, tr } = useI18n();
  const [activo, setActivo] = useState<string | null>(null);

  const asignados = useMemo(
    () => solicitudes.filter((s) => s.estado === "aprobada" && s.tutorId === usuario?.tutorId),
    [solicitudes, usuario?.tutorId],
  );

  const misTareas = useMemo(
    () => tareas.filter((x) => asignados.some((s) => s.id === x.solicitudId)),
    [tareas, asignados],
  );

  const entregadas = misTareas.filter((x) => x.estado === "entregada").length;

  function agregar(evento: FormEvent<HTMLFormElement>, solicitudId: string) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    crearTarea({
      solicitudId,
      titulo: String(datos.get("titulo") ?? ""),
      descripcion: String(datos.get("descripcion") ?? ""),
      entrega: String(datos.get("entrega") ?? ""),
    });
    formulario.reset();
    setActivo(null);
  }

  return (
    <PanelShell
      rol="tutor"
      acciones={
        <a
          href={MEET_LINK}
          target="_blank"
          rel="noreferrer"
          className={`${botonPrimario} animate-live-pulse`}
        >
          {t("Abrir sala Meet", "Open Meet room")}
          <span className="sr-only"> {t("(se abre en una pestaña nueva)", "(opens in a new tab)")}</span>
        </a>
      }
    >
      <section id="resumen" className="scroll-mt-24">
        <div className="hero-surface dotted-surface rounded-4xl border border-border p-8 shadow-soft">
          <p className="font-ui text-xs font-bold tracking-normal text-royal">
            {t("Sala de profesores · Medellín, Colombia", "Teachers' room · Medellín, Colombia")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {t("Hola, profe", "Hello, teacher")} <span className="text-gradient-animated">{usuario?.nombre}</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {t(
              "Aquí ves a los estudiantes que la administración te asignó, les pones tareas y entras a la clase en un clic.",
              "Here you see the students the administration assigned to you, give them homework and join the class in one click.",
            )}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Tarjeta
            titulo={t("Estudiantes", "Students")}
            valor={String(asignados.length)}
            detalle={t("Asignados por admin", "Assigned by admin")}
            icono={PANEL_IMG.tutorEstudiantes}
            tono="royal"
          />
          <Tarjeta titulo={t("Tareas creadas", "Homework created")} valor={String(misTareas.length)} icono={PANEL_IMG.tutorTareas} tono="grape" />
          <Tarjeta
            titulo={t("Entregas recibidas", "Submissions received")}
            valor={String(entregadas)}
            detalle={t(`${misTareas.length - entregadas} pendientes`, `${misTareas.length - entregadas} pending`)}
            icono={PANEL_IMG.tutorEntregadas}
            tono="mint"
          />
        </div>
      </section>

      <SeccionPanel
        id="estudiantes"
        titulo={t("Mis estudiantes", "My students")}
        descripcion={t("Cada tarjeta trae la sala de clase y el formulario para asignar tareas.", "Each card includes the classroom link and the form to assign homework.")}
      >
        {asignados.length === 0 ? (
          <Vacio icono="🪄" texto={t("Todavía no tienes estudiantes asignados por la administración.", "You do not have any students assigned by the administration yet.")} />
        ) : (
          <div className="flex flex-col gap-5">
            {asignados.map((solicitud) => {
              const paleta = PALETA_MATERIA[colorMateria(solicitud.materia)];
              const tareasEstudiante = misTareas.filter((x) => x.solicitudId === solicitud.id);
              return (
                <article
                  key={solicitud.id}
                  className={`rounded-4xl border bg-card p-6 shadow-soft ${paleta.borde}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-12 place-items-center rounded-2xl font-display text-lg font-bold text-foreground ${paleta.fondo}`}
                      >
                        {solicitud.estudianteNombre.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-bold">
                          {solicitud.estudianteNombre}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {tr(solicitud.materia)} · {tr(solicitud.dia)} {solicitud.hora} · {tr(solicitud.plan)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref. {solicitud.referencia} · {formatearPrecio(solicitud.monto)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={solicitud.meet ?? MEET_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className={botonSecundario}
                      >
                        {t("Entrar al Meet", "Join Meet")}
                        <span className="sr-only"> {t("(se abre en una pestaña nueva)", "(opens in a new tab)")}</span>
                      </a>
                      <button
                        onClick={() => setActivo(activo === solicitud.id ? null : solicitud.id)}
                        aria-expanded={activo === solicitud.id}
                        className={botonPrimario}
                      >
                        {activo === solicitud.id ? t("Cancelar", "Cancel") : t("Asignar tarea", "Assign homework")}
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 break-all rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                    {solicitud.meet ?? MEET_LINK}
                  </p>

                  {activo === solicitud.id && (
                    <form
                      onSubmit={(evento) => agregar(evento, solicitud.id)}
                      className="animate-pop mt-4 grid gap-3 rounded-3xl border border-border bg-muted p-4 md:grid-cols-3"
                    >
                      <input name="titulo" required aria-label={t("Título de la tarea", "Homework title")} placeholder={t("Título de la tarea", "Homework title")} className={inputPanel} />
                      <input name="descripcion" required aria-label={t("Descripción", "Description")} placeholder={t("Descripción", "Description")} className={inputPanel} />
                      <input name="entrega" type="date" aria-label={t("Fecha de entrega", "Due date")} className={inputPanel} />
                      <button type="submit" className={`${botonPrimario} md:col-span-3`}>
                        {t("Guardar tarea", "Save homework")}
                      </button>
                    </form>
                  )}

                  {tareasEstudiante.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-2">
                      {tareasEstudiante.map((tarea) => (
                        <li
                          key={tarea.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border p-4"
                        >
                          <div>
                            <p className="font-display text-sm font-bold">{tarea.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                              {tarea.descripcion} · {t("Entrega", "Due")}: {tarea.entrega || t("sin fecha", "no date")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <EstadoChip estado={tarea.estado} />
                            <button
                              onClick={() =>
                                marcarTarea(
                                  tarea.id,
                                  tarea.estado === "entregada" ? "pendiente" : "entregada",
                                )
                              }
                              className={botonSecundario}
                            >
                              {tarea.estado === "entregada" ? t("Reabrir", "Reopen") : t("Marcar entregada", "Mark as submitted")}
                            </button>
                            <button
                              onClick={() => eliminarTarea(tarea.id)}
                              className="chunky rounded-2xl border border-border bg-card px-4 py-2.5 font-ui text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                            >
                              {t("Eliminar", "Delete")}
                              <span className="sr-only"> {tarea.titulo}</span>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </SeccionPanel>

      <SeccionPanel id="tareas" titulo={t("Todas mis tareas", "All my homework")} descripcion={t("Vista rápida del avance del grupo.", "Quick view of the group's progress.")}>
        {misTareas.length === 0 ? (
          <Vacio icono="🗒️" texto={t("Aún no has creado tareas para tus estudiantes.", "You have not created any homework for your students yet.")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {misTareas.map((tarea) => {
              const dueno = asignados.find((s) => s.id === tarea.solicitudId);
              return (
                <li
                  key={tarea.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft"
                >
                  <div>
                    <p className="font-display font-bold">{tarea.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {dueno?.estudianteNombre} · {dueno ? tr(dueno.materia) : ""} · {t("Entrega", "Due")}:{" "}
                      {tarea.entrega || t("sin fecha", "no date")}
                    </p>
                  </div>
                  <EstadoChip estado={tarea.estado} />
                </li>
              );
            })}
          </ul>
        )}
      </SeccionPanel>
    </PanelShell>
  );
}

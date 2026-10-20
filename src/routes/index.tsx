import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass, Shirt } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import {
  DIAS,
  HORAS,
  MATERIAS,
  MATERIAS_DESTACADAS,
  PLANES,
  RESENAS,
  TUTORES,
  estrellas,
  formatearPrecio,
  iniciales,
  type Tutor,
} from "@/data/tutoraula";
import { rutaPanel, useApp } from "@/lib/store";
import { listarTutoresPublicos } from "@/lib/externo/profesores.functions";
import { useI18n } from "@/lib/preferencias";
import { Reveal } from "@/components/reveal";
import { Destello, FilaMarcas, Garabato } from "@/components/marcas";
import { Icono, LogoImg } from "@/components/icono-img";
import { FAQ_IMG, MASCOTA } from "@/lib/imagenes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tutorify | Tutorías académicas escolares en línea" },
      {
        name: "description",
        content:
          "Tutorify conecta estudiantes con tutores verificados de cálculo, física, química y lectura crítica. Agenda por día y hora, paga seguro y estudia en videollamada.",
      },
      { property: "og:title", content: "Tutorify | Tutorías académicas escolares" },
      {
        property: "og:description",
        content:
          "Busca por materia, día y hora, agenda tu clase y entra a tu sala virtual con un tutor verificado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Profesores desde la base de datos. Si falla o aún no existe la tabla, la página usa el catálogo de respaldo.
  loader: () => listarTutoresPublicos(),
  component: Landing,
});

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                                */
/* ------------------------------------------------------------------ */

function Modal({
  abierto,
  onClose,
  children,
  ancho = "max-w-md",
  etiqueta,
}: {
  abierto: boolean;
  onClose: () => void;
  children: ReactNode;
  ancho?: string;
  etiqueta: string;
}) {
  const { t } = useI18n();
  const caja = useRef<HTMLDivElement>(null);
  // onClose cambia en cada render del padre; se guarda en una ref para no re-enfocar el diálogo al escribir.
  const cerrar = useRef(onClose);
  cerrar.current = onClose;

  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    caja.current?.focus();
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        cerrar.current();
        return;
      }
      // Atrapa el foco dentro del diálogo mientras está abierto
      if (evento.key === "Tab" && caja.current) {
        const foco = Array.from(
          caja.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (foco.length === 0) return;
        const primero = foco[0]!;
        const ultimo = foco[foco.length - 1]!;
        if (evento.shiftKey && (document.activeElement === primero || document.activeElement === caja.current)) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      previo?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        tabIndex={-1}
        aria-label={t("Cerrar", "Close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={caja}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={etiqueta}
        className={`animate-pop relative max-h-[90vh] w-full ${ancho} overflow-y-auto rounded-3xl bg-card p-7 shadow-float outline-none`}
      >
        <button
          onClick={onClose}
          aria-label={t("Cerrar", "Close")}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-destructive"
        >
          <span aria-hidden="true">✕</span>
        </button>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClase =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-ring/20";

const SECCIONES = [
  ["inicio", "Inicio", "Home"],
  ["materias", "Materias", "Subjects"],
  ["tutores", "Tutores", "Tutors"],
  ["proceso", "Cómo funciona", "How it works"],
  ["mascota", "Mascota", "Mascot"],
  ["planes", "Planes", "Plans"],
  ["testimonios", "Reseñas", "Reviews"],
] as const;

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

function Landing() {
  const { usuario, crearSolicitud } = useApp();
  const { t, tr, idioma } = useI18n();
  const navigate = useNavigate();
  const datosTutores = Route.useLoaderData();
  const tutores = useMemo<Tutor[]>(
    () => (datosTutores?.ok ? datosTutores.tutores : TUTORES),
    [datosTutores],
  );
  // Las horas del filtro salen de los horarios reales de los profesores.
  const horasFiltro = useMemo(() => {
    const todas = [...new Set(tutores.flatMap((x) => x.horas))].sort();
    return todas.length ? todas : HORAS;
  }, [tutores]);

  const [texto, setTexto] = useState("");
  const [materia, setMateria] = useState("");
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [tutorActivo, setTutorActivo] = useState<Tutor | null>(null);
  const [planElegido, setPlanElegido] = useState(PLANES[0]!.nombre);
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [reservaDia, setReservaDia] = useState("");
  const [reservaHora, setReservaHora] = useState("");
  const [reservaMateria, setReservaMateria] = useState("");
  const [metodo, setMetodo] = useState("tarjeta");
  const [procesando, setProcesando] = useState(false);
  const [referencia, setReferencia] = useState("");
  const [errorPago, setErrorPago] = useState("");

  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(id);
  }, [aviso]);

  const tutoresFiltrados = useMemo(() => {
    const consulta = texto.trim().toLowerCase();
    return tutores.filter((tutor) => {
      const coincideTexto =
        !consulta ||
        tutor.nombre.toLowerCase().includes(consulta) ||
        tutor.biografia.toLowerCase().includes(consulta) ||
        tr(tutor.biografia).toLowerCase().includes(consulta) ||
        tutor.materias.join(" ").toLowerCase().includes(consulta) ||
        tutor.materias.map(tr).join(" ").toLowerCase().includes(consulta);
      return (
        coincideTexto &&
        (!materia || tutor.materias.includes(materia)) &&
        (!dia || tutor.dias.includes(dia)) &&
        (!hora || tutor.horas.includes(hora))
      );
    });
  }, [tutores, texto, materia, dia, hora, tr]);

  function irASeccion(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAbierto(false);
  }

  function abrirReserva(tutor: Tutor) {
    if (!usuario) {
      navigate({ to: "/auth", search: { modo: "registro" } });
      return;
    }
    if (usuario.rol !== "estudiante") {
      setAviso(t("Solo las cuentas de estudiante pueden agendar tutorías.", "Only student accounts can book tutoring sessions."));
      return;
    }
    setTutorActivo(tutor);
    setPaso(1);
    setReservaDia(dia && tutor.dias.includes(dia) ? dia : (tutor.dias[0] ?? ""));
    setReservaHora(hora && tutor.horas.includes(hora) ? hora : (tutor.horas[0] ?? ""));
    setReservaMateria(materia && tutor.materias.includes(materia) ? materia : (tutor.materias[0] ?? ""));
    setErrorPago("");
    setReferencia("");
  }

  function pagar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!tutorActivo) return;
    const plan = PLANES.find((p) => p.nombre === planElegido) ?? PLANES[0]!;
    setProcesando(true);
    setErrorPago("");
    window.setTimeout(async () => {
      const resultado = await crearSolicitud({
        materia: reservaMateria,
        plan: plan.nombre,
        monto: plan.precio,
        dia: reservaDia,
        hora: reservaHora,
        metodo,
      });
      setProcesando(false);
      if (!resultado.ok) {
        setErrorPago(resultado.error ?? t("No fue posible registrar el pago.", "We couldn't register the payment."));
        return;
      }
      setReferencia(resultado.referencia ?? "");
      setPaso(3);
    }, 1100);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-lg">
        <div className="mx-auto flex min-h-[74px] w-[92%] max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
          <button onClick={() => irASeccion("inicio")} aria-label={t("Tutorify, ir al inicio", "Tutorify, go to top")} className="flex items-center gap-2.5">
            <LogoImg className="animate-float size-11" />
            <span className="text-lg">
              Tutor<strong className="text-primary">ify</strong>
            </span>
          </button>

          <nav aria-label={t("Secciones de la página", "Page sections")} className="hidden items-center gap-5 lg:flex xl:gap-7">
            {SECCIONES.map(([id, etiquetaEs, etiquetaEn]) => (
              <button
                key={id}
                onClick={() => irASeccion(id)}
                className="group relative text-sm font-medium text-secondary-foreground"
              >
                {t(etiquetaEs, etiquetaEn)}
                <span aria-hidden="true" className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-brand-gradient transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {usuario ? (
              <Link
                to={rutaPanel(usuario.rol)}
                className="rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:opacity-90"
              >
                {t("Mi panel", "My dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  search={{ modo: "login" }}
                  className="hidden rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 hover:border-primary hover:text-primary sm:inline-flex"
                >
                  {t("Iniciar sesión", "Log in")}
                </Link>
                <Link
                  to="/auth"
                  search={{ modo: "registro" }}
                  className="rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:opacity-90"
                >
                  {t("Registrarse", "Sign up")}
                </Link>
              </>
            )}
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? t("Cerrar menú", "Close menu") : t("Abrir menú", "Open menu")}
              aria-expanded={menuAbierto}
              aria-controls="menu-movil"
              className="px-2 text-xl lg:hidden"
            >
              <span aria-hidden="true">{menuAbierto ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {menuAbierto && (
          <nav id="menu-movil" aria-label={t("Menú principal", "Main menu")} className="flex flex-col border-t border-border bg-card px-[4%] py-2 lg:hidden">
            {SECCIONES.map(([id, etiquetaEs, etiquetaEn]) => (
              <button
                key={id}
                onClick={() => irASeccion(id)}
                className="border-b border-border py-3 text-left text-sm font-medium"
              >
                {t(etiquetaEs, etiquetaEn)}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main id="contenido" tabIndex={-1} className="outline-none">
        {/* ================= HERO ================= */}
        <section id="inicio" className="hero-surface relative overflow-hidden pb-20 pt-16 sm:pt-24">
          <Destello className="absolute left-[8%] top-24 hidden size-7 sm:block" color="#ffb110" />
          <Destello className="absolute right-[9%] top-40 hidden size-5 sm:block" color="#62aef0" />
          <div className="mx-auto w-[92%] max-w-4xl text-center">
            <FilaMarcas />
            <h1 className="animate-rise mt-8 text-balance text-[2.6rem] font-bold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              {idioma === "en" ? (
                <>
                  Learn with tutors who <span className="text-gradient-animated">get you</span>
                </>
              ) : (
                <>
                  Aprende con tutores que te <span className="text-gradient-animated">entienden</span>
                </>
              )}
            </h1>
            <p className="lead-serif animate-rise mx-auto mt-6 max-w-2xl" style={{ animationDelay: "120ms" }}>
              {t(
                "Tutores verificados, clases en vivo y un plan de estudio hecho para ti. Elige tu materia, tu día y tu hora.",
                "Verified tutors, live classes and a study plan made for you. Pick your subject, your day and your time.",
              )}
            </p>

            <div className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "220ms" }}>
              <button
                onClick={() => irASeccion("tutores")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t("Encontrar mi tutor", "Find my tutor")}
              </button>
              <button
                onClick={() => irASeccion("materias")}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/70"
              >
                {t("Explorar materias", "Explore subjects")}
              </button>
            </div>
            <Garabato className="mx-auto mt-6 h-5 w-28" />
            <p className="mt-2 text-xs text-muted-foreground">{t("+1.200 estudiantes acompañados en Medellín, Colombia", "1,200+ students supported in Medellín, Colombia")}</p>

            <ul className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["4.8/5", t("Calificación media", "Average rating"), "card-marigold"],
                ["6", t("Áreas de estudio", "Study areas"), "card-sky"],
                ["98%", t("Sesiones cumplidas", "Sessions completed"), "card-peach"],
              ].map(([valor, etiqueta, tono], i) => (
                <Reveal como="li" key={etiqueta} delay={300 + i * 90} variante="scale" className={`${tono} rounded-xl p-4 text-left`}>
                  <strong className="block text-2xl font-bold tracking-tight">{valor}</strong>
                  <span className="text-xs opacity-80">{etiqueta}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ================= MATERIAS (protagonistas) ================= */}
        <section id="materias" className="py-20">
          <div className="mx-auto w-[92%] max-w-6xl">
            <Reveal className="mx-auto mb-11 max-w-xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {idioma === "en" ? (
                  <>
                    Subjects we <span className="text-gradient-animated">transform</span>
                  </>
                ) : (
                  <>
                    Materias que <span className="text-gradient-animated">transformamos</span>
                  </>
                )}
              </h2>
              <p className="lead-serif mt-2">
                {t(
                  "Elige un área y te llevamos directo a los tutores disponibles.",
                  "Pick an area and we'll take you straight to the available tutors.",
                )}
              </p>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MATERIAS_DESTACADAS.map((item, indice) => {
                const acento = ["card-marigold", "card-sky", "card-coral", "card-tint", "card-peach", "card-midnight"][indice % 6];
                const activa = materia === item.nombre;
                const disponibles = tutores.filter((x) => x.materias.includes(item.nombre)).length;
                return (
                  <Reveal key={item.nombre} delay={(indice % 3) * 80}>
                    <button
                      aria-pressed={activa}
                      onClick={() => {
                        setMateria(activa ? "" : item.nombre);
                        irASeccion("tutores");
                      }}
                      className={`${acento} group relative h-full w-full overflow-hidden rounded-xl p-6 text-left transition-transform duration-200 hover:-translate-y-0.5 ${
                        activa ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                      }`}
                    >
                      <span className="grid size-14 place-items-center rounded-xl bg-white p-1.5 text-2xl text-black transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110">
                        <Icono src={item.icono} className="size-full" />
                      </span>
                      <h3 className="mt-4 text-xl font-semibold">{tr(item.nombre)}</h3>
                      <p className="mt-1.5 text-sm opacity-80">{tr(item.descripcion)}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.temas.map((tema) => (
                          <span key={tema} className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-black">
                            {tr(tema)}
                          </span>
                        ))}
                      </div>
                      <p className="mt-5 text-sm font-medium">
                        {idioma === "en"
                          ? `${disponibles} tutor${disponibles === 1 ? "" : "s"} available`
                          : `${disponibles} tutor${disponibles === 1 ? "" : "es"} disponible${disponibles === 1 ? "" : "s"}`}{" "}
                        <span aria-hidden="true">→</span>
                      </p>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= TUTORES + FILTROS ================= */}
        <section id="tutores" className="bg-background py-20">
          <div className="mx-auto w-[92%] max-w-6xl">
            <Reveal className="mx-auto mb-11 max-w-xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("Nuestro equipo de tutores", "Our tutoring team")}</h2>
              <p className="lead-serif mt-2">
                {t(
                  "Especialistas verificados. Filtra por materia, día y horario disponible.",
                  "Verified specialists. Filter by subject, day and available time.",
                )}
              </p>
            </Reveal>

            <div className="grid items-start gap-7 lg:grid-cols-[280px_1fr]">
              <aside aria-label={t("Filtros de tutores", "Tutor filters")} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
                <Campo label={t("Buscar", "Search")}>
                  <input
                    type="search"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder={t("Nombre o palabra clave", "Name or keyword")}
                    className={inputClase}
                  />
                </Campo>
                <Campo label={t("Materia", "Subject")}>
                  <select value={materia} onChange={(e) => setMateria(e.target.value)} className={inputClase}>
                    <option value="">{t("Todas", "All")}</option>
                    {MATERIAS.map((m) => (
                      <option key={m} value={m}>
                        {tr(m)}
                      </option>
                    ))}
                  </select>
                </Campo>

                <div>
                  <p id="filtro-dia" className="mb-2 text-xs font-semibold text-muted-foreground">{t("Día disponible", "Available day")}</p>
                  <div role="group" aria-labelledby="filtro-dia" className="flex flex-wrap gap-1.5">
                    {DIAS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={dia === d}
                        aria-label={tr(d)}
                        onClick={() => setDia(dia === d ? "" : d)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          dia === d
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary hover:text-primary"
                        }`}
                      >
                        {tr(d).slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p id="filtro-hora" className="mb-2 text-xs font-semibold text-muted-foreground">{t("Horario", "Time")}</p>
                  <div role="group" aria-labelledby="filtro-hora" className="flex flex-wrap gap-1.5">
                    {horasFiltro.map((h) => (
                      <button
                        key={h}
                        type="button"
                        aria-pressed={hora === h}
                        onClick={() => setHora(hora === h ? "" : h)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          hora === h
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary hover:text-primary"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTexto("");
                    setMateria("");
                    setDia("");
                    setHora("");
                  }}
                  className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  {t("Limpiar filtros", "Clear filters")}
                </button>
              </aside>

              <div>
                <p role="status" aria-live="polite" className="mb-4 text-sm text-muted-foreground">
                  {idioma === "en"
                    ? `${tutoresFiltrados.length} tutor${tutoresFiltrados.length === 1 ? "" : "s"} available`
                    : `${tutoresFiltrados.length} tutor${tutoresFiltrados.length === 1 ? "" : "es"} disponible${tutoresFiltrados.length === 1 ? "" : "s"}`}
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  {tutoresFiltrados.map((tutor, i) => (
                    <Reveal key={tutor.id} delay={(i % 2) * 90}>
                      <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25">
                        <div className="flex items-center gap-3">
                          <span className={`grid size-14 place-items-center rounded-full border-2 text-lg font-bold text-foreground ${["border-royal bg-sky-tint", "border-grape bg-peach", "border-sun bg-sun/25"][tutor.id % 3]}`}>
                            {iniciales(tutor.nombre)}
                          </span>
                          <div>
                            <h3 className="text-lg font-bold">{tutor.nombre}</h3>
                            <p className="text-xs text-muted-foreground">
                              {tr(tutor.titulo)} · {tutor.ciudad}
                            </p>
                            {tutor.totalResenas > 0 ? (
                              <p
                                className="text-xs font-medium text-amber-ocre"
                                aria-label={t(
                                  `Calificación ${tutor.calificacion} de 5, ${tutor.totalResenas} reseñas`,
                                  `Rated ${tutor.calificacion} out of 5, ${tutor.totalResenas} reviews`,
                                )}
                              >
                                <span aria-hidden="true">
                                  {estrellas(tutor.calificacion)} {tutor.calificacion} ({tutor.totalResenas})
                                </span>
                              </p>
                            ) : (
                              <p className="text-xs font-semibold text-primary">{t("Nuevo en Tutorify", "New on Tutorify")}</p>
                            )}
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-muted-foreground">{tr(tutor.biografia)}</p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tutor.materias.map((m) => (
                            <span
                              key={m}
                              className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                            >
                              {tr(m)}
                            </span>
                          ))}
                        </div>

                        <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                          <div>
                            <dt className="inline font-semibold">{t("Días: ", "Days: ")}</dt>
                            <dd className="inline">{tutor.dias.map(tr).join(" · ")}</dd>
                          </div>
                          <div>
                            <dt className="inline font-semibold">{t("Horas: ", "Times: ")}</dt>
                            <dd className="inline">{tutor.horas.join(" · ")}</dd>
                          </div>
                        </dl>

                        <div className="mt-auto flex items-center justify-between pt-5">
                          <p className="text-lg font-bold tracking-tight">
                            {formatearPrecio(tutor.precioHora)}
                            <span className="text-xs font-normal text-muted-foreground">{t("/hora", "/hour")}</span>
                          </p>
                          <button
                            onClick={() => abrirReserva(tutor)}
                            aria-label={t(`Agendar con ${tutor.nombre}`, `Book with ${tutor.nombre}`)}
                            className="rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:opacity-90"
                          >
                            {t("Agendar", "Book")}
                          </button>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
                {tutoresFiltrados.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                    {t("No hay tutores con esa combinación de materia, día y hora.", "No tutors match that combination of subject, day and time.")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= PROCESO ================= */}
        <section id="proceso" className="py-20">
          <div className="mx-auto w-[92%] max-w-6xl">
            <Reveal className="mx-auto mb-11 max-w-xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("Así funciona Tutorify", "How Tutorify works")}</h2>
              <p className="lead-serif mt-2">{t("De la duda al dominio en cuatro pasos.", "From doubt to mastery in four steps.")}</p>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["1", t("Crea tu cuenta", "Create your account"), t("El registro es solo para estudiantes; los tutores son verificados por Tutorify.", "Sign-up is for students only; tutors are verified by Tutorify.")],
                ["2", t("Elige y paga", "Choose and pay"), t("Selecciona materia, día, hora y plan. El pago queda registrado con tu referencia.", "Select subject, day, time and plan. Your payment is recorded with your reference number.")],
                ["3", t("Aprobación", "Approval"), t("Nuestro equipo valida el pago y te asigna el tutor ideal para tu caso.", "Our team validates the payment and assigns the ideal tutor for your case.")],
                ["4", t("Clase y tareas", "Class and homework"), t("Entra al enlace de Google Meet y recibe tareas de tu tutor en tu panel.", "Join the Google Meet link and receive homework from your tutor in your dashboard.")],
              ].map(([num, titulo, texto2], i) => (
                <Reveal key={num} delay={i * 90}>
                  <article className={`${["card-sky", "card-marigold", "card-peach", "card-coral"][i]} h-full rounded-xl p-6 transition-transform duration-200 hover:-translate-y-0.5`}>
                    <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-white font-bold text-black">{num}</span>
                    <h3 className="mt-4 text-lg font-semibold">{titulo}</h3>
                    <p className="mt-1.5 text-sm opacity-85">{texto2}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= MASCOTA ================= */}
        <section id="mascota" className="hero-surface relative scroll-mt-24 overflow-hidden py-20">
          <Destello className="absolute right-[7%] top-16 hidden size-6 sm:block" color="#62aef0" />
          <Destello className="absolute bottom-20 left-[6%] hidden size-5 sm:block" color="#ffb110" />
          <div className="mx-auto w-[92%] max-w-6xl">
            <Reveal className="mx-auto mb-12 max-w-xl text-center">
              <p className="font-ui text-xs font-bold tracking-normal text-primary">{t("Nuestra mascota", "Our mascot")}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {idioma === "en" ? (
                  <>
                    Meet <span className="text-gradient-animated">our mascot</span>
                  </>
                ) : (
                  <>
                    Conoce <span className="text-gradient-animated">nuestra mascota</span>
                  </>
                )}
              </h2>
            </Reveal>

            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
              {/* Imagen */}
              <Reveal variante="left" className="relative mx-auto w-full max-w-md">
                <div aria-hidden="true" className="absolute inset-4 rounded-[2.5rem] bg-brand-gradient opacity-25 blur-2xl" />
                <div className="relative rounded-[2.5rem] border border-border bg-card p-6 shadow-float">
                  <img
                    src={MASCOTA}
                    alt={t("Nilo, el delfín guía de Tutorify, con chaqueta varsity y una brújula brillante", "Nilo, Tutorify's guide dolphin, wearing a varsity jacket and holding a glowing compass")}
                    loading="lazy"
                    decoding="async"
                    className="animate-float mx-auto aspect-square w-full object-contain"
                  />
                  <span className="pill-sun absolute -left-2 top-6 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-soft">
                    {t("Estilo 3D", "3D style")}
                  </span>
                  <span className="card-sky absolute -right-2 bottom-8 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-soft">
                    {t("Tu guía de estudio", "Your study guide")}
                  </span>
                </div>
              </Reveal>

              {/* Información */}
              <Reveal variante="right">
                <p className="font-ui text-xs font-bold tracking-normal text-muted-foreground">{t("Te presentamos a", "Say hello to")}</p>
                <h3 className="mt-1 text-5xl font-bold tracking-tight sm:text-6xl">
                  <span className="text-gradient-animated">Nilo</span>
                </h3>
                <p className="mt-1 text-lg font-semibold text-primary">{t("El Delfín Guía", "The Guide Dolphin")}</p>

                <p className="lead-serif mt-5">
                  {t(
                    "Los delfines son conocidos por su comunicación, su inteligencia y su forma de navegar en grupo. Nilo representa al tutor ideal: empático, rápido y un guía seguro en el «océano» del conocimiento.",
                    "Dolphins are known for their communication, intelligence and the way they navigate in groups. Nilo represents the ideal tutor: empathetic, quick and a trusted guide through the “ocean” of knowledge.",
                  )}
                </p>

                <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    ["card-sky", t("Comunicación", "Communication"), t("Explica claro y escucha de verdad.", "Explains clearly and truly listens.")],
                    ["card-marigold", t("Inteligencia", "Intelligence"), t("Rápido para entender cada duda.", "Quick to grasp every doubt.")],
                    ["card-peach", t("Trabajo en grupo", "Teamwork"), t("Navega contigo y tu tutor.", "Navigates with you and your tutor.")],
                  ].map(([tono, titulo, detalle], i) => (
                    <Reveal como="li" key={titulo} delay={120 + i * 90} variante="scale" className={`${tono} rounded-xl p-4`}>
                      <strong className="block text-sm font-bold">{titulo}</strong>
                      <span className="mt-1 block text-xs opacity-80">{detalle}</span>
                    </Reveal>
                  ))}
                </ul>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Shirt className="size-5" /></span>
                    <div>
                      <p className="text-sm font-bold">{t("Chaqueta varsity", "Varsity jacket")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("Moderna y universitaria: el toque académico de Nilo.", "Modern and collegiate: Nilo's academic touch.")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Compass className="size-5" /></span>
                    <div>
                      <p className="text-sm font-bold">{t("Brújula brillante", "Glowing compass")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("Simboliza la orientación en tu camino de estudio.", "Symbolizes guidance on your study journey.")}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => irASeccion("tutores")}
                  className="mt-7 rounded-lg bg-brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:opacity-90"
                >
                  {t("Navega con Nilo: encuentra tu tutor", "Navigate with Nilo: find your tutor")}
                </button>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= PLANES ================= */}
        <section id="planes" className="bg-background py-20">
          <div className="mx-auto w-[92%] max-w-6xl">
            <Reveal className="mx-auto mb-11 max-w-xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("Planes y tarifas", "Plans and pricing")}</h2>
              <p className="lead-serif mt-2">{t("Paga por clase o ahorra con paquetes de horas.", "Pay per class or save with hour packs.")}</p>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-3">
              {PLANES.map((plan, i) => (
                <Reveal key={plan.nombre} delay={i * 90}>
                  <article
                    className={`flex h-full flex-col rounded-xl p-7 ${
                      plan.destacado ? "card-midnight" : "border border-border bg-card"
                    }`}
                  >
                    {plan.destacado && (
                      <span className="pill-sun mb-3 w-fit rounded-full px-3 py-1 text-xs font-semibold">{t("Más elegido", "Most popular")}</span>
                    )}
                    <h3 className="text-lg font-semibold">{tr(plan.nombre)}</h3>
                    <p className="mt-2 text-3xl font-bold tracking-tight">
                      {formatearPrecio(plan.precio)}
                      <span className={`text-sm font-normal ${plan.destacado ? "text-white/70" : "text-muted-foreground"}`}>{tr(plan.unidad)}</span>
                    </p>
                    <ul className={`mt-5 space-y-2 text-sm ${plan.destacado ? "text-white/80" : "text-muted-foreground"}`}>
                      {plan.beneficios.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span aria-hidden="true" className={plan.destacado ? "text-sun" : "text-primary"}>✓</span>
                          {tr(b)}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        setPlanElegido(plan.nombre);
                        irASeccion("tutores");
                      }}
                      className={`mt-auto rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 ${
                        plan.destacado ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {t("Elegir plan", "Choose plan")}<span className="sr-only"> — {tr(plan.nombre)}</span>
                    </button>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIOS ================= */}
        <section id="testimonios" className="py-20">
          <div className="mx-auto w-[92%] max-w-6xl">
            <Reveal className="mx-auto mb-11 max-w-xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("Lo que dicen los estudiantes", "What students say")}</h2>
              <p className="lead-serif mt-2">{t("Calificaciones verificadas al finalizar cada sesión.", "Ratings verified after every session.")}</p>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {RESENAS.map((resena, i) => (
                <Reveal key={resena.estudiante} delay={i * 90}>
                  <article className="h-full rounded-xl border border-border bg-card p-6">
                    <p className="text-amber-ocre" role="img" aria-label={t(`${resena.puntuacion} de 5 estrellas`, `${resena.puntuacion} out of 5 stars`)}>{estrellas(resena.puntuacion)}</p>
                    <p className="mt-3 text-sm text-muted-foreground">“{tr(resena.comentario)}”</p>
                    <p className="mt-4 text-sm font-semibold">{resena.estudiante}</p>
                    <p className="text-xs text-muted-foreground">{t("Tutoría con", "Tutoring with")} {resena.tutor}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= PREGUNTAS FRECUENTES ================= */}
        <PreguntasFrecuentes />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto grid w-[92%] max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold">
              <LogoImg className="size-9" />
              <span>
                Tutor<span className="text-primary">ify</span>
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Plataforma colombiana de tutorías académicas escolares en línea.", "Colombian platform for online school tutoring.")}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">{t("Plataforma", "Platform")}</h3>
            <button onClick={() => irASeccion("tutores")} className="text-left hover:text-primary">
              {t("Buscar tutores", "Find tutors")}
            </button>
            <button onClick={() => irASeccion("planes")} className="text-left hover:text-primary">
              {t("Planes", "Plans")}
            </button>
            <button onClick={() => irASeccion("proceso")} className="text-left hover:text-primary">
              {t("Cómo funciona", "How it works")}
            </button>
            <button onClick={() => irASeccion("faq")} className="text-left hover:text-primary">
              {t("Preguntas frecuentes", "FAQ")}
            </button>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">{t("Cuenta", "Account")}</h3>
            <Link to="/auth" search={{ modo: "registro" }} className="hover:text-primary">
              {t("Crear cuenta de estudiante", "Create a student account")}
            </Link>
            <Link to="/auth" search={{ modo: "login" }} className="hover:text-primary">
              {t("Iniciar sesión", "Log in")}
            </Link>
            <Link to="/terminos" className="hover:text-primary">
              {t("Términos y condiciones", "Terms and conditions")}
            </Link>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">{t("Contacto", "Contact")}</h3>
            <span>hola@tutorify.co</span>
            <span>Medellín, Colombia</span>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          {t("© 2026 Tutorify. Todos los derechos reservados.", "© 2026 Tutorify. All rights reserved.")}
        </p>
      </footer>

      {/* ================= MODAL RESERVA / PAGO ================= */}
      <Modal
        abierto={!!tutorActivo}
        onClose={() => setTutorActivo(null)}
        ancho="max-w-lg"
        etiqueta={t("Agendar tutoría", "Book a tutoring session")}
      >
        {tutorActivo && (
          <>
            <h3 className="text-xl font-bold">{t("Agendar con", "Book with")} {tutorActivo.nombre}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr(tutorActivo.titulo)} · {formatearPrecio(tutorActivo.precioHora)}{t("/hora", "/hour")}
            </p>

            <ol aria-label={t("Pasos de la reserva", "Booking steps")} className="mt-5 flex gap-2 text-xs font-semibold">
              {[t("Horario", "Schedule"), t("Pago", "Payment"), t("Confirmación", "Confirmation")].map((etiqueta, indice) => (
                <li
                  key={indice}
                  aria-current={paso === indice + 1 ? "step" : undefined}
                  className={`flex-1 rounded-full px-3 py-1.5 text-center ${
                    paso >= indice + 1
                      ? "bg-brand-gradient text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {etiqueta}
                </li>
              ))}
            </ol>

            {paso === 1 && (
              <div className="mt-6 flex flex-col gap-4">
                <Campo label={t("Materia", "Subject")}>
                  <select
                    value={reservaMateria}
                    onChange={(e) => setReservaMateria(e.target.value)}
                    className={inputClase}
                  >
                    {tutorActivo.materias.map((m) => (
                      <option key={m} value={m}>
                        {tr(m)}
                      </option>
                    ))}
                  </select>
                </Campo>
                <div>
                  <p id="reserva-dia" className="mb-2 text-xs font-semibold text-muted-foreground">{t("Día", "Day")}</p>
                  <div role="group" aria-labelledby="reserva-dia" className="flex flex-wrap gap-2">
                    {tutorActivo.dias.map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={reservaDia === d}
                        onClick={() => setReservaDia(d)}
                        className={`rounded-full border px-3.5 py-2 text-xs font-semibold ${
                          reservaDia === d
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {tr(d)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p id="reserva-hora" className="mb-2 text-xs font-semibold text-muted-foreground">{t("Hora", "Time")}</p>
                  <div role="group" aria-labelledby="reserva-hora" className="flex flex-wrap gap-2">
                    {tutorActivo.horas.map((h) => (
                      <button
                        key={h}
                        type="button"
                        aria-pressed={reservaHora === h}
                        onClick={() => setReservaHora(h)}
                        className={`rounded-full border px-3.5 py-2 text-xs font-semibold ${
                          reservaHora === h
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <Campo label={t("Plan", "Plan")}>
                  <select
                    value={planElegido}
                    onChange={(e) => setPlanElegido(e.target.value)}
                    className={inputClase}
                  >
                    {PLANES.map((p) => (
                      <option key={p.nombre} value={p.nombre}>
                        {tr(p.nombre)} — {formatearPrecio(p.precio)}
                        {tr(p.unidad)}
                      </option>
                    ))}
                  </select>
                </Campo>
                <button
                  onClick={() => setPaso(2)}
                  disabled={!reservaDia || !reservaHora}
                  className="rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
                >
                  {t("Continuar al pago", "Continue to payment")}
                </button>
              </div>
            )}

            {paso === 2 && (
              <form onSubmit={pagar} className="mt-6 flex flex-col gap-4">
                <div className="rounded-2xl bg-muted p-4 text-sm">
                  <p className="font-semibold">{tr(reservaMateria)}</p>
                  <p className="text-muted-foreground">
                    {tr(reservaDia)} · {reservaHora} · {tr(planElegido)}
                  </p>
                  <p className="mt-2 text-lg font-bold text-primary">
                    {formatearPrecio(PLANES.find((p) => p.nombre === planElegido)?.precio ?? 0)}
                  </p>
                </div>
                <Campo label={t("Método de pago", "Payment method")}>
                  <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={inputClase}>
                    <option value="tarjeta">{t("Tarjeta débito / crédito", "Debit / credit card")}</option>
                    <option value="pse">PSE</option>
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                  </select>
                </Campo>
                {metodo === "tarjeta" && (
                  <Campo label={t("Número de tarjeta", "Card number")}>
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="cc-number"
                      maxLength={19}
                      placeholder="4242 4242 4242 4242"
                      className={inputClase}
                    />
                  </Campo>
                )}
                {errorPago && (
                  <p role="alert" className="text-sm text-destructive">
                    {tr(errorPago)}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={procesando}
                  className="rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
                >
                  {procesando ? t("Procesando pago…", "Processing payment…") : t("Pagar y enviar a revisión", "Pay and send for review")}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  {t("Pago simulado cifrado · El administrador aprueba la compra y asigna tu tutor", "Simulated encrypted payment · An administrator approves the purchase and assigns your tutor")}
                </p>
              </form>
            )}

            {paso === 3 && (
              <div className="mt-6 text-center">
                <div aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-2xl text-primary">
                  ✓
                </div>
                <h4 className="mt-4 text-lg font-bold">{t("Pago registrado", "Payment registered")}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("Referencia", "Reference")} <strong>{referencia}</strong>.{" "}
                  {t(
                    "Tu compra está en revisión; cuando el administrador la apruebe verás tu tutor asignado y el enlace de la clase en tu panel.",
                    "Your purchase is under review; once an administrator approves it you'll see your assigned tutor and the class link in your dashboard.",
                  )}
                </p>
                <Link
                  to="/panel/estudiante"
                  className="mt-6 inline-block rounded-lg bg-brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
                >
                  {t("Ir a mi panel", "Go to my dashboard")}
                </Link>
              </div>
            )}
          </>
        )}
      </Modal>

      {aviso && (
        <div role="status" aria-live="polite" className="animate-pop fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-float">
          {aviso}
        </div>
      )}
    </div>
  );
}

/* ================= PREGUNTAS FRECUENTES ================= */

const FAQS = [
  {
    icono: "💳",
    pregunta: "¿Cómo funciona el pago de una tutoría?",
    respuesta:
      "Agenda tu clase, crea tu cuenta de estudiante y realiza el pago con tu método preferido (Nequi, tarjeta o PSE). Nuestro equipo verifica el pago y, una vez aprobado, se te asigna el profesor ideal para tu materia. Si el pago no puede validarse, te contactamos para reintentarlo sin ningún cobro adicional.",
    en: {
      pregunta: "How does paying for a tutoring session work?",
      respuesta:
        "Book your class, create your student account and pay with your preferred method (Nequi, card or PSE). Our team verifies the payment and, once approved, assigns the ideal teacher for your subject. If the payment can't be validated, we'll contact you to try again at no extra charge.",
    },
  },
  {
    icono: "👩‍🏫",
    pregunta: "¿Quién elige a mi profesor?",
    respuesta:
      "Tú eliges la materia, el día y la hora que te convengan. Con esa información, nuestra administración te asigna al tutor verificado que mejor se ajuste a tu nivel y disponibilidad. Todos nuestros profesores pasan por un proceso de selección académica.",
    en: {
      pregunta: "Who chooses my teacher?",
      respuesta:
        "You choose the subject, day and time that suit you. With that information, our administration assigns the verified tutor who best fits your level and availability. All of our teachers go through an academic selection process.",
    },
  },
  {
    icono: "💻",
    pregunta: "¿Dónde se dictan las clases?",
    respuesta:
      "Todas las tutorías son 100% en línea por Google Meet. Cuando tu clase quede aprobada verás el botón «Entrar a la clase» en tu panel de estudiante, junto al nombre de tu profesor asignado. Solo necesitas un computador o celular con internet.",
    en: {
      pregunta: "Where are the classes held?",
      respuesta:
        "All tutoring sessions are 100% online through Google Meet. Once your class is approved you'll see the “Join class” button in your student dashboard, next to your assigned teacher's name. All you need is a computer or phone with internet.",
    },
  },
  {
    icono: "📚",
    pregunta: "¿Las tutorías incluyen tareas y seguimiento?",
    respuesta:
      "Sí. Tu profesor puede asignarte tareas y ejercicios desde su panel, y tú las marcas como entregadas desde el tuyo. Además, tu panel muestra tu progreso general para que siempre sepas cómo vas.",
    en: {
      pregunta: "Do the sessions include homework and follow-up?",
      respuesta:
        "Yes. Your teacher can assign you homework and exercises from their dashboard, and you mark them as submitted from yours. Your dashboard also shows your overall progress so you always know how you're doing.",
    },
  },
  {
    icono: "📍",
    pregunta: "¿Tutorify solo funciona en Medellín?",
    respuesta:
      "Nuestro equipo está en Medellín, Colombia, pero al ser clases virtuales puedes tomar tutorías desde cualquier ciudad del país. Los horarios que ves en la plataforma son hora colombiana (UTC-5).",
    en: {
      pregunta: "Does Tutorify only work in Medellín?",
      respuesta:
        "Our team is based in Medellín, Colombia, but since classes are virtual you can take tutoring from any city in the country. The times you see on the platform are Colombian time (UTC-5).",
    },
  },
  {
    icono: "🔁",
    pregunta: "¿Puedo cambiar de horario o de profesor?",
    respuesta:
      "Claro. Si tu horario ya no te funciona o sientes que necesitas otro estilo de enseñanza, escríbenos por el chat de la plataforma o a hola@tutorify.co y reagendamos tu clase o te asignamos otro tutor sin costo adicional.",
    en: {
      pregunta: "Can I change my schedule or my teacher?",
      respuesta:
        "Of course. If your schedule no longer works or you feel you need a different teaching style, write to us through the platform chat or at hola@tutorify.co and we'll reschedule your class or assign you another tutor at no extra cost.",
    },
  },
];

function PreguntasFrecuentes() {
  const [abierta, setAbierta] = useState<number | null>(0);
  const { t, idioma } = useI18n();

  return (
    <section id="faq" className="scroll-mt-24 py-20">
      <div className="mx-auto w-[92%] max-w-3xl">
        <Reveal className="mx-auto mb-10 max-w-xl text-center">
          <p className="font-ui text-xs font-bold tracking-normal text-primary">
            {t("Resolvemos tus dudas", "We answer your questions")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {idioma === "en" ? (
              <>
                Frequently asked <span className="text-gradient-animated">questions</span>
              </>
            ) : (
              <>
                Preguntas <span className="text-gradient-animated">frecuentes</span>
              </>
            )}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "Todo lo que necesitas saber antes de tu primera clase. ¿Otra duda? Usa el chat de la esquina.",
              "Everything you need to know before your first class. Another question? Use the chat in the corner.",
            )}
          </p>
        </Reveal>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, indice) => {
            const abierto = abierta === indice;
            const texto = idioma === "en" ? faq.en : faq;
            return (
              <Reveal key={indice}>
                <div
                  className={`chunky-lift overflow-hidden rounded-3xl border bg-card transition-colors ${
                    abierto ? "border-primary/50" : "border-border"
                  }`}
                >
                  <button
                    onClick={() => setAbierta(abierto ? null : indice)}
                    aria-expanded={abierto}
                    aria-controls={`faq-respuesta-${indice}`}
                    id={`faq-pregunta-${indice}`}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span
                      className={`grid size-12 shrink-0 place-items-center rounded-2xl p-1 transition-colors ${
                        abierto ? "bg-brand-gradient" : "bg-secondary"
                      }`}
                    >
                      <Icono src={FAQ_IMG[indice] ?? faq.icono} className="size-full" />
                    </span>
                    <span className="flex-1 font-display text-sm font-bold sm:text-base">
                      {texto.pregunta}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold transition-transform duration-300 ${
                        abierto
                          ? "rotate-180 border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                  <div
                    id={`faq-respuesta-${indice}`}
                    role="region"
                    aria-labelledby={`faq-pregunta-${indice}`}
                    inert={!abierto}
                    className={`grid transition-all duration-300 ease-out ${
                      abierto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 pl-20 text-sm leading-relaxed text-muted-foreground">
                        {texto.respuesta}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

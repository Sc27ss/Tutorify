import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import { rutaPanel, useApp, type Rol } from "@/lib/store";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/preferencias";
import { Icono, LogoImg } from "@/components/icono-img";
import { PANEL_IMG } from "@/lib/imagenes";

const ETIQUETAS: Record<Rol, [string, string]> = {
  estudiante: ["Panel del estudiante", "Student dashboard"],
  tutor: ["Panel del profesor", "Teacher dashboard"],
  admin: ["Panel administrador", "Admin dashboard"],
};

const NAV: Record<Rol, { id: string; icono: string; texto: string; en: string }[]> = {
  estudiante: [
    { id: "resumen", icono: PANEL_IMG.estResumen, texto: "Resumen", en: "Overview" },
    { id: "tutorias", icono: PANEL_IMG.estTutorias, texto: "Mis tutorías", en: "My tutoring" },
    { id: "tareas", icono: PANEL_IMG.estTareas, texto: "Mis tareas", en: "My homework" },
  ],
  tutor: [
    { id: "resumen", icono: PANEL_IMG.tutorResumen, texto: "Resumen", en: "Overview" },
    { id: "estudiantes", icono: PANEL_IMG.tutorEstudiantes, texto: "Estudiantes", en: "Students" },
    { id: "tareas", icono: PANEL_IMG.tutorTareas, texto: "Tareas", en: "Homework" },
  ],
  admin: [
    { id: "resumen", icono: "🏠", texto: "Resumen", en: "Overview" },
    { id: "compras", icono: PANEL_IMG.adminCompras, texto: "Compras", en: "Purchases" },
    { id: "equipo", icono: PANEL_IMG.adminEquipo, texto: "Equipo", en: "Team" },
    { id: "usuarios", icono: PANEL_IMG.adminUsuarios, texto: "Usuarios", en: "Users" },
    { id: "tareas", icono: PANEL_IMG.adminTareas, texto: "Tareas", en: "Homework" },
  ],
};

const COLOR_ROL: Record<Rol, string> = {
  estudiante: "bg-mint",
  tutor: "bg-royal",
  admin: "bg-grape",
};

function Logo({ compacto = false }: { compacto?: boolean }) {
  const { t } = useI18n();
  return (
    <Link to="/" aria-label={t("Tutorify, ir al inicio", "Tutorify, go to home")} className="flex items-center gap-2.5">
      <LogoImg className="size-11" />
      {!compacto && (
        <span className="font-display text-lg font-bold text-sidebar-foreground">
          Tutor<span className="text-primary">ify</span>
        </span>
      )}
    </Link>
  );
}

export function PanelShell({
  rol,
  children,
  acciones,
}: {
  rol: Rol;
  children: ReactNode;
  acciones?: ReactNode;
}) {
  const { usuario, cerrarSesion } = useApp();
  const { t, idioma } = useI18n();
  const navigate = useNavigate();
  const [activo, setActivo] = useState("resumen");
  const etiquetaRol = ETIQUETAS[rol][idioma === "en" ? 1 : 0];

  function ir(id: string) {
    setActivo(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const items = NAV[rol];

  return (
    <div className="min-h-screen bg-background text-foreground lg:pl-[264px]">
      {/* ===== Barra lateral ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Logo />

        <nav aria-label={t("Secciones del panel", "Dashboard sections")} className="mt-2 flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => ir(item.id)}
              aria-current={activo === item.id ? "true" : undefined}
              className={`chunky flex items-center gap-3 rounded-2xl border px-4 py-3 text-left font-ui text-sm font-bold transition-colors ${
                activo === item.id
                  ? "border-transparent bg-accent text-accent-foreground"
                  : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icono src={item.icono} className="size-7 shrink-0" />
              {idioma === "en" ? item.en : item.texto}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-3xl bg-sidebar-accent p-4">
            <div className="flex items-center gap-3">
              <span
                className={`grid size-10 place-items-center rounded-2xl font-ui text-sm font-bold text-foreground ${COLOR_ROL[rol]}`}
              >
                {(usuario?.nombre ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-sidebar-foreground">
                  {usuario?.nombre}
                </p>
                <p className="truncate text-[0.6875rem] text-sidebar-foreground/60">{etiquetaRol}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              void cerrarSesion().then(() => navigate({ to: "/" }));
            }}
            className="chunky flex items-center justify-center gap-2 rounded-2xl border border-destructive/40 px-4 py-2.5 font-ui text-xs font-bold text-destructive/90 hover:bg-destructive/10"
          >
            <Icono src={PANEL_IMG.salir} className="size-6" />
            {t("Cerrar sesión", "Log out")}
          </button>
        </div>
      </aside>

      {/* ===== Barra superior ===== */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex min-h-[74px] w-[92%] max-w-5xl flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-3 lg:hidden">
            <LogoImg className="size-10" />
            <span className="font-display text-base font-bold">
              Tutor<span className="text-primary">ify</span>
            </span>
          </div>
          <p className="hidden font-ui text-xs font-bold tracking-normal text-muted-foreground lg:block">
            {etiquetaRol}
          </p>
          <div className="flex items-center gap-2">
            {acciones}
            <button
              onClick={() => {
                void cerrarSesion().then(() => navigate({ to: "/" }));
              }}
              className="chunky flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-1.5 font-ui text-xs font-bold text-muted-foreground hover:text-destructive lg:hidden"
            >
              <Icono src={PANEL_IMG.salir} className="size-6" />
              {t("Salir", "Log out")}
            </button>
          </div>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto w-[92%] max-w-5xl pb-28 pt-8 outline-none lg:pb-16">
        {children}
      </main>

      {/* ===== Nav inferior móvil ===== */}
      <nav aria-label={t("Navegación del panel", "Dashboard navigation")} className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-card px-2 py-2 lg:hidden">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => ir(item.id)}
            aria-current={activo === item.id ? "true" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 font-ui text-[0.625rem] font-bold ${
              activo === item.id ? "bg-primary/12 text-primary" : "text-muted-foreground"
            }`}
          >
            <Icono src={item.icono} className="size-7" />
            {idioma === "en" ? item.en : item.texto}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function GuardiaPanel({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { usuario, listo } = useApp();
  const { t } = useI18n();

  if (!listo) {
    return (
      <div role="status" className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("Cargando…", "Loading…")}
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="hero-surface grid min-h-screen place-items-center px-4 text-center">
        <div className="rounded-4xl border border-border bg-card p-10 shadow-card">
          <span aria-hidden="true" className="text-5xl">🔒</span>
          <h1 className="mt-4 font-display text-2xl font-bold">{t("Necesitas iniciar sesión", "You need to log in")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("Ingresa con tu cuenta para ver este panel.", "Log in with your account to see this dashboard.")}</p>
          <Link
            to="/auth"
            search={{ modo: "login" }}
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2 font-ui text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("Iniciar sesión", "Log in")}
          </Link>
        </div>
      </div>
    );
  }

  if (usuario.rol !== rol) {
    return (
      <div className="hero-surface grid min-h-screen place-items-center px-4 text-center">
        <div className="rounded-4xl border border-border bg-card p-10 shadow-card">
          <span aria-hidden="true" className="text-5xl">🚧</span>
          <h1 className="mt-4 font-display text-2xl font-bold">
            {t("Este panel no corresponde a tu cuenta", "This dashboard doesn't belong to your account")}
          </h1>
          <Link
            to={rutaPanel(usuario.rol)}
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2 font-ui text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("Ir a mi panel", "Go to my dashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const TONOS: Record<string, string> = {
  mint: "card-sky",
  sun: "card-marigold",
  royal: "card-tint",
  grape: "card-peach",
};

export function Tarjeta({
  titulo,
  valor,
  detalle,
  icono = "✨",
  tono = "mint",
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono?: string;
  tono?: keyof typeof TONOS | string;
}) {
  return (
    <Reveal variante="scale">
    <div className={`chunky-lift h-full rounded-xl p-5 ${TONOS[tono] ?? TONOS["mint"]}`}>
      <span className="block size-12"><Icono src={icono} className="size-12" /></span>
      <p className="mt-2 font-ui text-xs font-medium opacity-80">{titulo}</p>
      <p className="font-display text-3xl font-bold text-foreground">{valor}</p>
      {detalle && <p className="mt-1 text-xs opacity-75">{detalle}</p>}
    </div>
    </Reveal>
  );
}

export function SeccionPanel({
  id,
  titulo,
  descripcion,
  children,
}: {
  id: string;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="font-display text-3xl font-bold tracking-tight">{titulo}</h2>
      {descripcion && <p className="lead-serif mt-1 !text-base">{descripcion}</p>}
      <Reveal className="mt-5">{children}</Reveal>
    </section>
  );
}

export function Vacio({ icono, texto, extra }: { icono: string; texto: string; extra?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <span aria-hidden="true" className="text-4xl">{icono}</span>
      <p className="mt-3 text-sm text-muted-foreground">{texto}</p>
      {extra}
    </div>
  );
}

export const inputPanel =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-ring/20";

export const botonPrimario =
  "rounded-lg bg-primary px-4 py-1.5 font-ui text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export const botonSecundario =
  "rounded-lg bg-accent px-4 py-1.5 font-ui text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/70 disabled:opacity-50";

export function EstadoChip({ estado }: { estado: string }) {
  const { tr } = useI18n();
  const estilos: Record<string, string> = {
    pendiente: "bg-sun/25 text-amber-ocre",
    aprobada: "bg-mint/20 text-mint-deep",
    rechazada: "bg-destructive/12 text-destructive",
    entregada: "bg-royal/12 text-royal",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 font-ui text-xs font-medium ${estilos[estado] ?? "bg-secondary text-secondary-foreground"}`}
    >
      {tr(estado)}
    </span>
  );
}

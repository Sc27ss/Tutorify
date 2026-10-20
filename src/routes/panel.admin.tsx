import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TUTORES, formatearPrecio, iniciales } from "@/data/tutoraula";
import {
  EstadoChip,
  GuardiaPanel,
  PanelShell,
  SeccionPanel,
  Tarjeta,
  Vacio,
  botonPrimario,
  inputPanel,
} from "@/components/panel";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/preferencias";
import { PANEL_IMG } from "@/lib/imagenes";
import { AdminUsuarios } from "@/components/admin-usuarios";
import { AdminProfesores } from "@/components/admin-profesores";
import { useServerFn } from "@tanstack/react-start";
import { listarUsuarios, type UsuarioAdmin } from "@/lib/externo/admin.functions";
import { listarPerfilesProfesores, type PerfilProfesor } from "@/lib/externo/profesores.functions";

export const Route = createFileRoute("/panel/admin")({
  head: () => ({
    meta: [
      { title: "Panel administrador | Tutorify" },
      {
        name: "description",
        content: "Aprueba pagos, asigna profesores a los estudiantes y supervisa la operación de Tutorify.",
      },
      { property: "og:title", content: "Panel administrador | Tutorify" },
      { property: "og:description", content: "Aprobación de compras y asignación de tutores en Tutorify." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <GuardiaPanel rol="admin">
      <PanelAdmin />
    </GuardiaPanel>
  ),
});

function PanelAdmin() {
  const { solicitudes, tareas, aprobarSolicitud, rechazarSolicitud } = useApp();
  const { t, tr, locale } = useI18n();
  const listar = useServerFn(listarUsuarios);
  const listarPerfiles = useServerFn(listarPerfilesProfesores);
  const [cuentas, setCuentas] = useState<UsuarioAdmin[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilProfesor[]>([]);
  const [perfilesOk, setPerfilesOk] = useState(true);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const recargarCuentas = useCallback(async () => {
    try { setCuentas(await listar()); }
    catch { setError(t("No fue posible cargar los usuarios. Revisa que hayas ejecutado el SQL en Supabase.", "We could not load the users. Check that you ran the SQL in Supabase.")); }
    finally { setCargandoCuentas(false); }
    // Los perfiles de profesores viven en otra tabla: si aún no existe, el resto del panel sigue funcionando.
    try {
      const r = await listarPerfiles();
      setPerfiles(r.perfiles);
      setPerfilesOk(r.ok);
    } catch { setPerfilesOk(false); }
  }, [listar, listarPerfiles]);
  useEffect(() => { void recargarCuentas(); }, [recargarCuentas]);
  const profesores = useMemo(() => cuentas.filter(u => u.rol === "tutor" && u.tutorId !== null), [cuentas]);
  async function actuar(accion: () => Promise<void>) {
    setOcupado(true); setError("");
    try { await accion(); } catch { setError(t("No fue posible guardar la decisión. Revisa el profesor y vuelve a intentarlo.", "We could not save the decision. Check the teacher and try again.")); }
    finally { setOcupado(false); }
  }
  const [seleccion, setSeleccion] = useState<Record<string, number>>({});
  const [filtro, setFiltro] = useState<"todas" | "pendiente" | "aprobada" | "rechazada">("todas");

  const listado = useMemo(
    () => (filtro === "todas" ? solicitudes : solicitudes.filter((s) => s.estado === filtro)),
    [solicitudes, filtro],
  );

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length;
  const ingresos = solicitudes
    .filter((s) => s.estado === "aprobada")
    .reduce((total, s) => total + s.monto, 0);

  function tutoresSugeridos(materia: string) {
    const disponibles = profesores.filter(u => u.activo).map(u => ({
      id: u.tutorId ?? 0, nombre: u.nombre,
      materias: perfiles.find(x => x.usuarioId === u.id)?.materias ?? TUTORES.find(x => x.id === u.tutorId)?.materias ?? [],
    }));
    const compatibles = disponibles.filter(x => x.materias.includes(materia));
    return compatibles.length ? compatibles : disponibles;
  }

  return (
    <PanelShell rol="admin">
      {/* ===== Resumen ===== */}
      <section id="resumen" className="scroll-mt-24">
        <div className="hero-surface dotted-surface rounded-4xl border border-border p-8 shadow-soft">
          <p className="font-ui text-xs font-bold tracking-normal text-grape">
            {t("Centro de operaciones", "Operations center")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {t("Administración de", "Administration of")} <span className="text-gradient-animated">Tutorify</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {t(
              "Valida los pagos de los estudiantes, asigna el profesor correcto y vigila la operación en Medellín.",
              "Validate student payments, assign the right teacher and keep an eye on operations in Medellín.",
            )}
          </p>
          {pendientes > 0 && (
            <p role="status" className="animate-live-pulse mt-4 inline-block rounded-full bg-sun/25 px-4 py-2 font-ui text-xs font-bold text-amber-ocre">
              <span aria-hidden="true">🔔</span>{" "}
              {t(`${pendientes} compra(s) esperando tu aprobación`, `${pendientes} purchase(s) waiting for your approval`)}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta titulo={t("Compras totales", "Total purchases")} valor={String(solicitudes.length)} icono={PANEL_IMG.adminComprasTotales} tono="royal" />
          <Tarjeta
            titulo={t("Pendientes", "Pending")}
            valor={String(pendientes)}
            detalle={t("Requieren aprobación", "Need approval")}
            icono={PANEL_IMG.adminPendientes}
            tono="sun"
          />
          <Tarjeta titulo={t("Ingresos aprobados", "Approved revenue")} valor={formatearPrecio(ingresos)} icono={PANEL_IMG.adminIngresos} tono="mint" />
          <Tarjeta titulo={t("Tareas activas", "Active homework")} valor={String(tareas.length)} icono={PANEL_IMG.adminTareasActivas} tono="grape" />
        </div>
      </section>

      {/* ===== Compras ===== */}
      <SeccionPanel
        id="compras"
        titulo={t("Compras y pagos", "Purchases and payments")}
        descripcion={t("Aprueba el pago y asigna el profesor en un solo paso.", "Approve the payment and assign the teacher in a single step.")}
      >
        {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
        <div className="mb-5 flex flex-wrap gap-2">
          {(["todas", "pendiente", "aprobada", "rechazada"] as const).map((valor) => (
            <button
              key={valor}
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
              className={`chunky rounded-full border px-4 py-2 font-ui text-[0.6875rem] font-bold ${
                filtro === valor
                  ? "border-mint-deep bg-mint text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-mint-deep/50"
              }`}
            >
              {tr(valor)}
            </button>
          ))}
        </div>

        {listado.length === 0 ? (
          <Vacio icono="🗂️" texto={t("No hay compras con ese estado.", "There are no purchases with that status.")} />
        ) : (
          <div className="flex flex-col gap-4">
            {listado.map((solicitud) => (
              <article
                key={solicitud.id}
                className="chunky-lift rounded-4xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-2xl bg-grape/15 font-ui text-sm font-bold text-grape-deep">
                      {iniciales(solicitud.estudianteNombre)}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold">
                        {solicitud.estudianteNombre}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tr(solicitud.materia)} · {tr(solicitud.dia)} {solicitud.hora} · {tr(solicitud.plan)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ref. {solicitud.referencia} · {formatearPrecio(solicitud.monto)} ·{" "}
                        {tr(solicitud.metodo)} · {new Date(solicitud.creada).toLocaleString(locale)}
                      </p>
                    </div>
                  </div>
                  <EstadoChip estado={solicitud.estado} />
                </div>

                {solicitud.estado === "pendiente" ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl bg-sun/10 p-4">
                    <select
                      aria-label={t(`Profesor para la compra ${solicitud.referencia}`, `Teacher for purchase ${solicitud.referencia}`)}
                      value={seleccion[solicitud.id] ?? tutoresSugeridos(solicitud.materia)[0]?.id ?? 1}
                      onChange={(e) =>
                        setSeleccion((prev) => ({ ...prev, [solicitud.id]: Number(e.target.value) }))
                      }
                      className={`${inputPanel} max-w-xs`}
                    >
                      {tutoresSugeridos(solicitud.materia).map((tutor) => (
                        <option key={tutor.id} value={tutor.id}>
                          {tutor.nombre} — {tutor.materias.map(tr).join(", ")}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={ocupado || tutoresSugeridos(solicitud.materia).length === 0}
                      onClick={() => void actuar(() =>
                        aprobarSolicitud(
                          solicitud.id,
                          seleccion[solicitud.id] ?? tutoresSugeridos(solicitud.materia)[0]?.id ?? 1,
                        )
                      )}
                      className={botonPrimario}
                    >
                      <span aria-hidden="true">✅</span> {t("Aprobar y asignar profesor", "Approve and assign teacher")}
                    </button>
                    <button
                      disabled={ocupado} onClick={() => void actuar(() => rechazarSolicitud(solicitud.id, "Pago no validado por la administración."))}
                      className="chunky rounded-2xl border border-border bg-card px-5 py-2.5 font-ui text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      {t("Rechazar", "Reject")}
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
                    {solicitud.estado === "aprobada"
                      ? `✅ ${t("Profesor asignado", "Assigned teacher")}: ${solicitud.tutorNombre} · ${solicitud.meet}`
                      : `❌ ${tr(solicitud.nota || "Compra rechazada.")}`}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </SeccionPanel>

      {/* ===== Equipo ===== */}
      <SeccionPanel
        id="equipo"
        titulo={t("Equipo de profesores", "Teaching team")}
        descripcion={t("Registra profesores, edita sus datos y revisa la carga de estudiantes de cada tutor verificado.", "Register teachers, edit their details and review each verified tutor's student load.")}
      >
        <AdminProfesores
          profesores={profesores}
          perfiles={perfiles}
          perfilesOk={perfilesOk}
          solicitudes={solicitudes}
          recargar={recargarCuentas}
        />
        {profesores.length === 0 && !cargandoCuentas && (
          <Vacio icono="👩‍🏫" texto={t("Aún no hay profesores. Usa «Registrar profesor» para crear el primero.", "There are no teachers yet. Use “Register teacher” to create the first one.")} />
        )}
      </SeccionPanel>
      <AdminUsuarios usuarios={cuentas} cargando={cargandoCuentas} recargar={recargarCuentas} />
    </PanelShell>
  );
}

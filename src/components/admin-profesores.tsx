import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, UserPlus, X } from "lucide-react";

import { DIAS, HORAS_TUTOR, MATERIAS, NIVELES, TUTORES, formatearPrecio, iniciales, type Nivel } from "@/data/tutoraula";
import { botonPrimario, botonSecundario, inputPanel } from "@/components/panel";
import type { Solicitud } from "@/lib/data/tipos";
import type { UsuarioAdmin } from "@/lib/externo/admin.functions";
import * as api from "@/lib/externo/profesores.functions";
import { useI18n } from "@/lib/preferencias";

type Valores = {
  nombre: string;
  email: string;
  password: string;
  ciudad: string;
  titulo: string;
  nivel: Nivel;
  biografia: string;
  materias: string[];
  dias: string[];
  horas: string[];
  precio: string;
};

const VACIO: Valores = {
  nombre: "",
  email: "",
  password: "",
  ciudad: "Medellín",
  titulo: "",
  nivel: "bachillerato",
  biografia: "",
  materias: [],
  dias: [],
  horas: [],
  precio: "35000",
};

const NIVEL_EN: Record<Nivel, string> = {
  primaria: "Primary school",
  bachillerato: "High school",
  icfes: "ICFES prep",
  universidad: "University",
};

const alternar = (lista: string[], valor: string) =>
  lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor];

function Chips({
  etiqueta,
  opciones,
  valor,
  onCambio,
  mostrar = (x: string) => x,
}: {
  etiqueta: string;
  opciones: string[];
  valor: string[];
  onCambio: (nuevo: string[]) => void;
  mostrar?: (x: string) => string;
}) {
  return (
    <div className="sm:col-span-2">
      <p className="mb-2 text-sm">{etiqueta}</p>
      <div role="group" aria-label={etiqueta} className="flex flex-wrap gap-1.5">
        {opciones.map((o) => {
          const activo = valor.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambio(alternar(valor, o))}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary hover:text-primary"
              }`}
            >
              {mostrar(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormularioProfesor({
  modo,
  inicial,
  ocupado,
  error,
  onEnviar,
  onCancelar,
}: {
  modo: "crear" | "editar";
  inicial: Valores;
  ocupado: boolean;
  error: string;
  onEnviar: (valores: Valores) => void;
  onCancelar: () => void;
}) {
  const { t, tr } = useI18n();
  const [v, setV] = useState<Valores>(inicial);
  const [errorLocal, setErrorLocal] = useState("");
  const poner = <K extends keyof Valores>(campo: K, valor: Valores[K]) => setV((prev) => ({ ...prev, [campo]: valor }));

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const precio = Number(v.precio);
    let problema = "";
    if (v.nombre.trim().length < 2) problema = t("Escribe el nombre del profesor.", "Enter the teacher's name.");
    else if (modo === "crear" && !/^\S+@\S+\.\S+$/.test(v.email.trim())) problema = t("Escribe un correo válido.", "Enter a valid email.");
    else if (modo === "crear" && v.password.length < 6) problema = t("La contraseña debe tener al menos 6 caracteres.", "The password must have at least 6 characters.");
    else if (v.ciudad.trim().length < 2) problema = t("Indica dónde vive el profesor.", "Enter where the teacher lives.");
    else if (v.titulo.trim().length < 2) problema = t("Indica su nivel educativo o título.", "Enter their education level or degree.");
    else if (v.biografia.trim().length < 10) problema = t("La descripción corta debe tener al menos 10 caracteres.", "The short description must have at least 10 characters.");
    else if (v.materias.length === 0) problema = t("Selecciona al menos una materia.", "Select at least one subject.");
    else if (v.dias.length === 0) problema = t("Selecciona al menos un día de trabajo.", "Select at least one working day.");
    else if (v.horas.length === 0) problema = t("Selecciona al menos una hora de trabajo.", "Select at least one working hour.");
    else if (!Number.isInteger(precio) || precio < 1000 || precio > 1_000_000)
      problema = t("El precio por hora debe estar entre $1.000 y $1.000.000.", "The hourly price must be between $1,000 and $1,000,000.");
    setErrorLocal(problema);
    if (!problema) onEnviar(v);
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" noValidate>
      <label className="text-sm">
        {t("Nombre completo", "Full name")}
        <input value={v.nombre} onChange={(e) => poner("nombre", e.target.value)} maxLength={100} required className={inputPanel} />
      </label>
      {modo === "crear" ? (
        <label className="text-sm">
          {t("Correo", "Email")}
          <input type="email" value={v.email} onChange={(e) => poner("email", e.target.value)} maxLength={180} required autoComplete="off" className={inputPanel} />
        </label>
      ) : (
        <label className="text-sm">
          {t("Correo", "Email")}
          <input value={v.email} readOnly disabled className={`${inputPanel} opacity-60`} />
        </label>
      )}
      {modo === "crear" && (
        <label className="text-sm sm:col-span-2">
          {t("Contraseña inicial", "Initial password")}
          <input type="password" value={v.password} onChange={(e) => poner("password", e.target.value)} minLength={6} maxLength={72} required autoComplete="new-password" className={inputPanel} />
        </label>
      )}
      <label className="text-sm">
        {t("¿Dónde vive?", "Where does the teacher live?")}
        <input value={v.ciudad} onChange={(e) => poner("ciudad", e.target.value)} maxLength={80} required placeholder="Medellín" className={inputPanel} />
      </label>
      <label className="text-sm">
        {t("Precio por hora (COP)", "Price per hour (COP)")}
        <input type="number" inputMode="numeric" min={1000} max={1000000} step={1000} value={v.precio} onChange={(e) => poner("precio", e.target.value)} required className={inputPanel} />
      </label>
      <label className="text-sm">
        {t("Nivel educativo / título", "Education level / degree")}
        <input value={v.titulo} onChange={(e) => poner("titulo", e.target.value)} maxLength={120} required placeholder={t("Ej. Magíster en Matemáticas", "E.g. Master's in Mathematics")} className={inputPanel} />
      </label>
      <label className="text-sm">
        {t("Nivel que enseña", "Level taught")}
        <select value={v.nivel} onChange={(e) => poner("nivel", e.target.value as Nivel)} className={inputPanel}>
          {NIVELES.map((n) => (
            <option key={n.valor} value={n.valor}>
              {t(n.etiqueta, NIVEL_EN[n.valor])}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        {t("Descripción corta", "Short description")}
        <textarea value={v.biografia} onChange={(e) => poner("biografia", e.target.value)} maxLength={300} rows={3} required className={inputPanel} />
        <span className="text-xs text-muted-foreground">{v.biografia.length}/300</span>
      </label>

      <Chips etiqueta={t("Materias que dicta", "Subjects taught")} opciones={MATERIAS} valor={v.materias} onCambio={(x) => poner("materias", x)} mostrar={tr} />
      <Chips etiqueta={t("Días que trabaja", "Working days")} opciones={DIAS} valor={v.dias} onCambio={(x) => poner("dias", x)} mostrar={tr} />
      <Chips etiqueta={t("Horario de trabajo (hora de inicio de cada clase)", "Working hours (start time of each class)")} opciones={HORAS_TUTOR} valor={v.horas} onCambio={(x) => poner("horas", x)} />

      {(errorLocal || error) && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {errorLocal || error}
        </p>
      )}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" disabled={ocupado} className={botonPrimario}>
          {ocupado
            ? t("Guardando…", "Saving…")
            : modo === "crear"
              ? t("Registrar profesor", "Register teacher")
              : t("Guardar cambios", "Save changes")}
        </button>
        <button type="button" onClick={onCancelar} className={botonSecundario}>
          {t("Cancelar", "Cancel")}
        </button>
      </div>
    </form>
  );
}

export function AdminProfesores({
  profesores,
  perfiles,
  perfilesOk,
  solicitudes,
  recargar,
}: {
  profesores: UsuarioAdmin[];
  perfiles: api.PerfilProfesor[];
  perfilesOk: boolean;
  solicitudes: Solicitud[];
  recargar: () => Promise<void>;
}) {
  const { t, tr } = useI18n();
  const crear = useServerFn(api.crearProfesor);
  const actualizar = useServerFn(api.actualizarPerfilProfesor);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<{ usuario: UsuarioAdmin; valores: Valores } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const porUsuario = useMemo(() => new Map(perfiles.map((p) => [p.usuarioId, p])), [perfiles]);

  /** Perfil de la base de datos; si aún no existe, el del catálogo de respaldo (profesores 1-3 de demostración). */
  function perfilDe(u: UsuarioAdmin): api.PerfilDatos | null {
    const real = porUsuario.get(u.id);
    if (real) return real;
    const respaldo = TUTORES.find((x) => x.id === u.tutorId);
    return respaldo
      ? {
          ciudad: respaldo.ciudad,
          titulo: respaldo.titulo,
          nivel: respaldo.nivel,
          biografia: respaldo.biografia,
          materias: respaldo.materias,
          dias: respaldo.dias,
          horas: respaldo.horas,
          precioHora: respaldo.precioHora,
          calificacion: respaldo.calificacion,
          totalResenas: respaldo.totalResenas,
        }
      : null;
  }

  useEffect(() => {
    if (!editando) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditando(null);
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [editando]);

  const datosEnvio = (v: Valores) => ({
    ciudad: v.ciudad.trim(),
    titulo: v.titulo.trim(),
    nivel: v.nivel,
    biografia: v.biografia.trim(),
    materias: v.materias,
    dias: v.dias,
    horas: v.horas,
    precioHora: Number(v.precio),
  });

  async function guardar(accion: () => Promise<{ ok: boolean; error: string }>, exito: string) {
    setOcupado(true);
    setError("");
    try {
      const r = await accion();
      if (!r.ok) {
        setError(tr(r.error));
        return false;
      }
      await recargar();
      setMensaje(exito);
      return true;
    } catch {
      setError(t("No fue posible guardar. Revisa los datos e inténtalo nuevamente.", "We could not save. Check the data and try again."));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function registrar(v: Valores) {
    const ok = await guardar(
      () => crear({ data: { ...datosEnvio(v), nombre: v.nombre.trim(), email: v.email.trim().toLowerCase(), password: v.password } }),
      t(`Profesor ${v.nombre.trim()} registrado correctamente.`, `Teacher ${v.nombre.trim()} registered successfully.`),
    );
    if (ok) setAbierto(false);
  }

  async function editar(v: Valores) {
    if (!editando) return;
    const id = editando.usuario.id;
    const ok = await guardar(
      () => actualizar({ data: { ...datosEnvio(v), id, nombre: v.nombre.trim() } }),
      t("Perfil actualizado.", "Profile updated."),
    );
    if (ok) setEditando(null);
  }

  function abrirEdicion(u: UsuarioAdmin) {
    const p = perfilDe(u);
    setError("");
    setMensaje("");
    setEditando({
      usuario: u,
      valores: {
        ...VACIO,
        nombre: u.nombre,
        email: u.email,
        ciudad: p?.ciudad ?? VACIO.ciudad,
        titulo: p?.titulo ?? "",
        nivel: p?.nivel ?? VACIO.nivel,
        biografia: p?.biografia ?? "",
        materias: p?.materias ?? [],
        dias: p?.dias ?? [],
        horas: p?.horas ?? [],
        precio: String(p?.precioHora ?? VACIO.precio),
      },
    });
  }

  return (
    <>
      {!perfilesOk && (
        <p role="status" className="mb-4 rounded-2xl bg-sun/15 p-4 text-sm text-amber-ocre">
          {t(
            "Para registrar profesores con todas sus características debes ejecutar una vez el archivo supabase-profesores.sql en Supabase (SQL Editor).",
            "To register teachers with all their details you must run the supabase-profesores.sql file once in Supabase (SQL Editor).",
          )}
        </p>
      )}
      {mensaje && (
        <p role="status" className="mb-4 rounded-2xl bg-mint/20 p-3 text-sm font-medium text-mint-deep">
          {mensaje}
        </p>
      )}

      <div className="mb-5">
        {abierto ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold">{t("Registrar nuevo profesor", "Register a new teacher")}</h3>
              <button type="button" onClick={() => setAbierto(false)} aria-label={t("Cerrar formulario", "Close form")} className="text-muted-foreground hover:text-destructive">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <FormularioProfesor modo="crear" inicial={VACIO} ocupado={ocupado} error={error} onEnviar={(v) => void registrar(v)} onCancelar={() => setAbierto(false)} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setError("");
              setMensaje("");
              setAbierto(true);
            }}
            className={`${botonPrimario} inline-flex items-center gap-2`}
          >
            <UserPlus aria-hidden="true" className="size-4" /> {t("Registrar profesor", "Register teacher")}
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {profesores.map((u) => {
          const p = perfilDe(u);
          const activos = solicitudes.filter((s) => s.estado === "aprobada" && s.tutorId === u.tutorId).length;
          return (
            <article key={u.id} className="chunky-lift flex flex-col rounded-4xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient font-ui text-sm font-bold text-primary-foreground">
                  {iniciales(u.nombre)}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-display font-bold">{u.nombre}</h3>
                  <p className="truncate text-xs text-muted-foreground">{p ? tr(p.titulo) : u.email}</p>
                </div>
              </div>

              {p ? (
                <>
                  <p className="mt-3 text-sm text-muted-foreground">{p.biografia}</p>
                  <p className="mt-3 text-sm font-medium">{p.materias.map(tr).join(" · ")}</p>
                  <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>
                      <dt className="inline font-semibold">{t("Vive en: ", "Lives in: ")}</dt>
                      <dd className="inline">{p.ciudad}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">{t("Nivel: ", "Level: ")}</dt>
                      <dd className="inline">{t(NIVELES.find((n) => n.valor === p.nivel)?.etiqueta ?? "", NIVEL_EN[p.nivel])}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">{t("Días: ", "Days: ")}</dt>
                      <dd className="inline">{p.dias.map(tr).join(" · ")}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">{t("Horas: ", "Times: ")}</dt>
                      <dd className="inline">{p.horas.join(" · ")}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">{t("Precio: ", "Price: ")}</dt>
                      <dd className="inline">
                        {formatearPrecio(p.precioHora)}
                        {t("/hora", "/hour")}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="mt-3 rounded-2xl bg-sun/15 p-3 text-xs text-amber-ocre">
                  {t(
                    "Perfil incompleto: no aparece en la página de inicio hasta que lo completes.",
                    "Incomplete profile: it won't appear on the home page until you complete it.",
                  )}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1">
                <p
                  className={`inline-block rounded-full px-3 py-1 font-ui text-[0.6875rem] font-bold ${
                    !u.activo ? "bg-secondary text-muted-foreground" : activos > 0 ? "bg-mint/20 text-mint-deep" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {u.activo ? t(`${activos} estudiante(s) activo(s)`, `${activos} active student(s)`) : t("Desactivado", "Disabled")}
                </p>
                <button type="button" onClick={() => abrirEdicion(u)} className={`${botonSecundario} inline-flex items-center gap-1.5`}>
                  <Pencil aria-hidden="true" className="size-3.5" /> {p ? t("Editar perfil", "Edit profile") : t("Completar perfil", "Complete profile")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {editando && (
        <div role="dialog" aria-modal="true" aria-label={t("Editar perfil del profesor", "Edit teacher profile")} className="fixed inset-0 z-50 grid place-items-center bg-background/90 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-float">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold">
                {t("Editar perfil de", "Edit profile of")} {editando.usuario.nombre}
              </h3>
              <button type="button" onClick={() => setEditando(null)} aria-label={t("Cerrar", "Close")} className="text-muted-foreground hover:text-destructive">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <FormularioProfesor modo="editar" inicial={editando.valores} ocupado={ocupado} error={error} onEnviar={(v) => void editar(v)} onCancelar={() => setEditando(null)} />
          </div>
        </div>
      )}
    </>
  );
}

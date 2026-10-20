import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Trash2, UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputPanel, SeccionPanel } from "@/components/panel";
import * as api from "@/lib/externo/admin.functions";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/preferencias";

export function AdminUsuarios({
  usuarios,
  cargando,
  recargar,
}: {
  usuarios: api.UsuarioAdmin[];
  cargando: boolean;
  recargar: () => Promise<void>;
}) {
  const { usuario, tareas, eliminarTarea } = useApp();
  const { t, tr } = useI18n();
  const crear = useServerFn(api.crearUsuario);
  const actualizar = useServerFn(api.actualizarUsuario);
  const eliminar = useServerFn(api.eliminarUsuario);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [buscar, setBuscar] = useState("");
  const [rol, setRol] = useState<api.UsuarioAdmin["rol"]>("estudiante");
  const [claveUsuario, setClaveUsuario] = useState<api.UsuarioAdmin | null>(null);
  const [clave, setClave] = useState("");

  async function ejecutar(accion: () => Promise<{ ok: boolean; error: string }>) {
    setOcupado(true); setMensaje("");
    try {
      const resultado = await accion();
      if (!resultado.ok) { setMensaje(tr(resultado.error)); return false; }
      await recargar(); setMensaje(t("Cambios guardados.", "Changes saved.")); return true;
    } catch { setMensaje(t("No fue posible guardar los cambios. Inténtalo nuevamente.", "We could not save the changes. Please try again.")); return false; }
    finally { setOcupado(false); }
  }

  async function nuevo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const datos = new FormData(form);
    const ok = await ejecutar(() => crear({ data: {
      nombre: String(datos.get("nombre")), email: String(datos.get("email")),
      password: String(datos.get("password")), rol, tutorId: null,
    } }));
    if (ok) { form.reset(); setRol("estudiante"); }
  }

  const visibles = usuarios.filter(u => `${u.nombre} ${u.email}`.toLowerCase().includes(buscar.toLowerCase()));
  return <>
    <SeccionPanel id="usuarios" titulo={t("Usuarios", "Users")} descripcion={t(`${usuarios.length} cuentas registradas`, `${usuarios.length} registered accounts`)}>
      {mensaje && <p role="status" className="mb-4 text-sm text-foreground">{mensaje}</p>}
      <form onSubmit={nuevo} className="grid gap-3 border-y border-border py-5 sm:grid-cols-2">
        <label className="text-sm">{t("Nombre", "Name")}<input name="nombre" required minLength={2} maxLength={100} className={inputPanel} /></label>
        <label className="text-sm">{t("Correo", "Email")}<input name="email" type="email" required className={inputPanel} /></label>
        <label className="text-sm">{t("Contraseña inicial", "Initial password")}<input name="password" type="password" minLength={6} maxLength={72} required autoComplete="new-password" className={inputPanel} /></label>
        <label className="text-sm">{t("Rol", "Role")}<select value={rol} onChange={e => setRol(e.target.value as api.UsuarioAdmin["rol"])} className={inputPanel}><option value="estudiante">{t("Estudiante", "Student")}</option><option value="tutor">{t("Profesor", "Teacher")}</option><option value="admin">{t("Administrador", "Administrator")}</option></select></label>
        <Button disabled={ocupado} type="submit" className="self-end font-ui"><UserPlus aria-hidden="true" /> {t("Crear usuario", "Create user")}</Button>
      </form>
      <input aria-label={t("Buscar usuarios", "Search users")} placeholder={t("Buscar por nombre o correo", "Search by name or email")} value={buscar} onChange={e => setBuscar(e.target.value)} className={`${inputPanel} my-5`} />
      {cargando ? <p role="status">{t("Cargando usuarios…", "Loading users…")}</p> : visibles.length === 0 ? <p className="text-muted-foreground">{t("No hay usuarios.", "There are no users.")}</p> : <div className="divide-y divide-border">
        {visibles.map(u => <article key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="min-w-0"><h3 className="font-display font-bold">{u.nombre}</h3><p className="break-all text-sm text-muted-foreground">{u.email}</p><p className="text-xs text-muted-foreground">{u.activo ? t("Activo", "Active") : t("Desactivado", "Disabled")} · {u.proveedor === "google" ? "Google" : t("Correo", "Email")}{u.rol === "tutor" && u.tutorId ? ` · ${t("Profesor", "Teacher")} #${u.tutorId}` : ""}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label={t(`Rol de ${u.email}`, `Role of ${u.email}`)} disabled={ocupado || u.id === usuario?.id} value={u.rol} className="rounded-md border border-border bg-card px-2 py-2 text-sm" onChange={e => {
              const nuevoRol = e.target.value as api.UsuarioAdmin["rol"];
              void ejecutar(() => actualizar({ data: { id: u.id, rol: nuevoRol } }));
            }}><option value="estudiante">{t("Estudiante", "Student")}</option><option value="tutor">{t("Profesor", "Teacher")}</option><option value="admin">{t("Administrador", "Administrator")}</option></select>
            <Button variant="outline" disabled={ocupado || u.id === usuario?.id} onClick={() => void ejecutar(() => actualizar({ data: { id: u.id, activo: !u.activo } }))}>{u.activo ? <X aria-hidden="true" /> : <Check aria-hidden="true" />}{u.activo ? t("Desactivar", "Disable") : t("Activar", "Enable")}</Button>
            <Button variant="outline" size="icon" title={t("Restablecer contraseña", "Reset password")} aria-label={t(`Restablecer contraseña de ${u.email}`, `Reset password for ${u.email}`)} disabled={ocupado} onClick={() => { setClaveUsuario(u); setClave(""); }}><KeyRound aria-hidden="true" /></Button>
            <Button variant="destructive" size="icon" title={t("Eliminar usuario", "Delete user")} aria-label={t(`Eliminar ${u.email}`, `Delete ${u.email}`)} disabled={ocupado || u.id === usuario?.id} onClick={() => { if (window.confirm(t(`¿Eliminar a ${u.nombre} y sus compras y tareas?`, `Delete ${u.nombre} along with their purchases and homework?`))) void ejecutar(() => eliminar({ data: { id: u.id } })); }}><Trash2 aria-hidden="true" /></Button>
          </div>
        </article>)}
      </div>}
      {claveUsuario && <div role="dialog" aria-modal="true" aria-labelledby="clave-titulo" className="fixed inset-0 z-50 grid place-items-center bg-background/95 px-4">
        <form className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-soft" onSubmit={async e => { e.preventDefault(); if (await ejecutar(() => actualizar({ data: { id: claveUsuario.id, password: clave } }))) { setClaveUsuario(null); setClave(""); } }}>
          <h3 id="clave-titulo" className="font-display text-lg font-bold">{t("Restablecer contraseña", "Reset password")}</h3><p className="mb-4 break-all text-sm text-muted-foreground">{claveUsuario.email}</p>
          <label className="text-sm">{t("Nueva contraseña", "New password")}<input autoFocus type="password" minLength={6} maxLength={72} required value={clave} onChange={e => setClave(e.target.value)} className={inputPanel} autoComplete="new-password" /></label>
          <div className="mt-4 flex gap-2"><Button disabled={ocupado}>{t("Guardar", "Save")}</Button><Button type="button" variant="outline" onClick={() => setClaveUsuario(null)}>{t("Cancelar", "Cancel")}</Button></div>
        </form>
      </div>}
    </SeccionPanel>
    <SeccionPanel id="tareas" titulo={t("Todas las tareas", "All homework")}>
      {tareas.length === 0 ? <p className="text-sm text-muted-foreground">{t("No hay tareas registradas.", "There is no homework registered.")}</p> : tareas.map(tarea => <div key={tarea.id} className="flex items-center justify-between gap-3 border-b border-border py-3"><div><p className="font-bold">{tarea.titulo}</p><p className="text-sm text-muted-foreground">{tr(tarea.estado)} · {tarea.entrega}</p></div><Button size="icon" variant="destructive" title={t("Eliminar tarea", "Delete homework")} aria-label={t(`Eliminar tarea ${tarea.titulo}`, `Delete homework ${tarea.titulo}`)} onClick={async () => { if (!window.confirm(t("¿Eliminar esta tarea?", "Delete this homework?"))) return; try { await eliminarTarea(tarea.id); } catch { setMensaje(t("No fue posible eliminar la tarea.", "We could not delete the homework.")); } }}><Trash2 aria-hidden="true" /></Button></div>)}
    </SeccionPanel>
  </>;
}
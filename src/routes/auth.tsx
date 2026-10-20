import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { clienteGoogle, iniciarConGoogle } from "@/lib/externo/google";
import { loginGoogle } from "@/lib/externo/auth.functions";

import { rutaPanel, useApp } from "@/lib/store";
import { useI18n } from "@/lib/preferencias";
import { LogoImg } from "@/components/icono-img";

type Busqueda = { modo: "login" | "registro" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Busqueda => ({
    modo: search["modo"] === "registro" ? "registro" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Ingresar o crear cuenta | Tutorify" },
      {
        name: "description",
        content:
          "Crea tu cuenta de estudiante en Tutorify o inicia sesión para agendar tutorías y ver tus clases.",
      },
      { property: "og:title", content: "Ingresar o crear cuenta | Tutorify" },
      {
        property: "og:description",
        content: "Acceso a Tutorify para estudiantes, profesores y administración.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const inputClase =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-ring/20";

function AuthPage() {
  const { modo } = Route.useSearch();
  const navigate = useNavigate();
  const { registrar, iniciarSesion, usuario } = useApp();
  const { t, tr } = useI18n();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const verificarGoogle = useServerFn(loginGoogle);

  useEffect(() => {
    // Only consume a real OAuth callback, never an unrelated stored identity.
    const params = new URLSearchParams(window.location.search);
    if (params.has("error")) { window.history.replaceState(null, "", "/auth?modo=login"); setError(t("No se pudo completar el acceso con Google. Revisa su configuración e inténtalo nuevamente.", "We couldn't complete the Google sign-in. Check its configuration and try again.")); return; }
    if (!params.has("code") && !window.location.hash.includes("error")) return;
    setOcupado(true);
    void (async () => {
      try {
        const { data, error: fallo } = await clienteGoogle().auth.getSession();
        if (fallo || !data.session) throw new Error("google");
        const resultado = await verificarGoogle({ data: { accessToken: data.session.access_token } });
        await clienteGoogle().auth.signOut({ scope: "local" });
        window.history.replaceState(null, "", "/auth?modo=login");
        if (!resultado.ok) { setError(tr(resultado.error)); return; }
        window.location.assign(rutaPanel(resultado.usuario.rol));
      } catch { setError(t("No se pudo completar el acceso con Google. Revisa su configuración e inténtalo nuevamente.", "We couldn't complete the Google sign-in. Check its configuration and try again.")); }
      finally { setOcupado(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificarGoogle]);

  async function google() {
    setError(""); setOcupado(true);
    try {
      const fallo = await iniciarConGoogle();
      if (fallo) { setError(t("Google todavía no está disponible. Puedes ingresar con correo y contraseña.", "Google isn't available yet. You can log in with email and password.")); setOcupado(false); }
    } catch { setError(t("No se pudo conectar con Google.", "Couldn't connect to Google.")); setOcupado(false); }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const email = String(datos.get("email") ?? "");
    const password = String(datos.get("password") ?? "");
    setError("");
    setOcupado(true);

    if (modo === "registro") {
      const resultado = await registrar({ nombre: String(datos.get("nombre") ?? ""), email, password });
      setOcupado(false);
      if (!resultado.ok) {
        setError(tr(resultado.error ?? "No fue posible crear la cuenta."));
        return;
      }
      navigate({ to: "/panel/estudiante" });
      return;
    }

    const resultado = await iniciarSesion(email, password);
    setOcupado(false);
    if (!resultado.ok || !resultado.rol) {
      setError(tr(resultado.error ?? "No fue posible iniciar sesión."));
      return;
    }
    navigate({ to: rutaPanel(resultado.rol) });
  }

  return (
    <main id="contenido" tabIndex={-1} className="hero-surface grid min-h-screen place-items-center px-4 py-14 outline-none">
      <div className="w-full max-w-md animate-pop rounded-xl border border-border bg-card p-8">
        <Link to="/" aria-label={t("Tutorify, volver al inicio", "Tutorify, back to home")} className="flex items-center gap-2.5">
          <LogoImg className="size-10" />
          <span className="text-lg">
            Tutor<strong className="text-primary">ify</strong>
          </span>
        </Link>

        <nav aria-label={t("Ingresar o crear cuenta", "Log in or sign up")} className="mt-6 flex rounded-lg bg-secondary p-1 text-sm font-medium">
          <Link
            to="/auth"
            search={{ modo: "login" }}
            aria-current={modo === "login" ? "page" : undefined}
            className={`flex-1 rounded-md py-1.5 text-center transition-colors ${modo === "login" ? "bg-card" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("Ingresar", "Log in")}
          </Link>
          <Link
            to="/auth"
            search={{ modo: "registro" }}
            aria-current={modo === "registro" ? "page" : undefined}
            className={`flex-1 rounded-md py-1.5 text-center transition-colors ${modo === "registro" ? "bg-card" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("Crear cuenta", "Sign up")}
          </Link>
        </nav>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          {modo === "registro" ? t("Crea tu cuenta de estudiante", "Create your student account") : t("Bienvenido de nuevo", "Welcome back")}
        </h1>
        {modo === "registro" && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t(
              "El registro público es exclusivo para estudiantes. Las cuentas de profesor son creadas y verificadas por el equipo de Tutorify.",
              "Public sign-up is for students only. Teacher accounts are created and verified by the Tutorify team.",
            )}
          </p>
        )}

        <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
          {modo === "registro" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{t("Nombre completo", "Full name")}</span>
              <input name="nombre" required autoComplete="name" className={inputClase} />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("Correo electrónico", "Email address")}</span>
            <input name="email" type="email" required autoComplete="email" className={inputClase} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("Contraseña", "Password")}</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={modo === "registro" ? "new-password" : "current-password"}
              aria-describedby="ayuda-clave"
              className={inputClase}
            />
            <span id="ayuda-clave" className="text-xs text-muted-foreground">
              {t("Mínimo 6 caracteres.", "At least 6 characters.")}
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={ocupado}
            className="rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:opacity-90"
          >
            {ocupado ? t("Conectando…", "Connecting…") : modo === "registro" ? t("Crear cuenta", "Sign up") : t("Ingresar", "Log in")}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("o", "or")}<span className="h-px flex-1 bg-border" /></div>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void google()}
          className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1f] shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4285F4]/60 hover:shadow-float focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4285F4]/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0 transition-transform duration-300 group-hover:scale-110">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span>{ocupado ? t("Conectando…", "Connecting…") : t("Continuar con Google", "Continue with Google")}</span>
        </button>
        <p className="mt-2 text-center text-[0.6875rem] text-muted-foreground">
          {t("Acceso rápido y seguro con tu cuenta de Google.", "Quick and secure access with your Google account.")}
        </p>

        {usuario && (
          <Link
            to={rutaPanel(usuario.rol)}
            className="mt-4 block text-center text-sm font-semibold text-primary"
          >
            {t("Ya tienes sesión activa · Ir a mi panel", "You're already logged in · Go to my dashboard")}
          </Link>
        )}

        {(import.meta.env.DEV || import.meta.env["VITE_MOSTRAR_CUENTAS_DEMO"] === "true") && (
        <div className="mt-6 rounded-lg bg-secondary p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{t("Cuentas de demostración", "Demo accounts")}</p>
          <p>{t("Administrador", "Administrator")}: admin@gmail.com / admin123</p>
          <p>{t("Profesores", "Teachers")}: laura@tutorify.co · carlos@tutorify.co · ana@tutorify.co / tutor123</p>
        </div>
        )}
      </div>
    </main>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppProvider } from "@/lib/store";
import { BotonCreditos } from "@/components/creditos";
import { Chatbot } from "@/components/chatbot";
import { AjustesFlotantes } from "@/components/ajustes";
import { SCRIPT_INICIAL, useI18n } from "@/lib/preferencias";

const botonAzul =
  "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";
const botonFantasma =
  "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/70";

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="animate-pop max-w-md rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-6xl font-bold tracking-tighter">404</p>
        <h1 className="mt-3 text-2xl font-semibold">{t("Esta página no existe", "This page doesn't exist")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "El enlace pudo haber cambiado o ya no está disponible. Vuelve al inicio para seguir explorando.",
            "The link may have changed or is no longer available. Go back home to keep exploring.",
          )}
        </p>
        <div className="mt-6">
          <Link to="/" className={botonAzul}>
            {t("Ir al inicio", "Go to home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const { t } = useI18n();
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="animate-pop max-w-md rounded-xl border border-border bg-card p-10 text-center">
        <h1 className="text-2xl font-semibold">{t("No pudimos cargar esta página", "We couldn't load this page")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "Algo salió mal de nuestro lado. Puedes reintentar o volver al inicio.",
            "Something went wrong on our side. You can try again or go back home.",
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className={botonAzul}
          >
            {t("Reintentar", "Try again")}
          </button>
          <a href="/" className={botonFantasma}>
            {t("Ir al inicio", "Go to home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f6f5f4" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Tutorify" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "Tutorify | Tutorías académicas escolares" },
      {
        name: "description",
        content: "Tutorify conecta estudiantes con tutores verificados en línea.",
      },
      { name: "author", content: "Tutorify" },
      { property: "og:title", content: "Tutorify | Tutorías académicas escolares" },
      {
        property: "og:description",
        content: "Tutorify conecta estudiantes con tutores verificados en línea.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [{ children: SCRIPT_INICIAL }],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:wght@400&family=Atkinson+Hyperlegible:wght@400;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const TITULOS: Record<string, [string, string]> = {
  "/": ["Tutorify | Tutorías académicas escolares en línea", "Tutorify | Online school tutoring"],
  "/auth": ["Ingresar o crear cuenta | Tutorify", "Log in or sign up | Tutorify"],
  "/terminos": ["Términos y condiciones | Tutorify", "Terms and conditions | Tutorify"],
  "/panel/estudiante": ["Mi panel de estudiante | Tutorify", "My student dashboard | Tutorify"],
  "/panel/tutor": ["Panel del profesor | Tutorify", "Teacher dashboard | Tutorify"],
  "/panel/admin": ["Panel administrador | Tutorify", "Admin dashboard | Tutorify"],
};

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { idioma, t } = useI18n();
  const ruta = useRouterState({ select: (estado) => estado.location.pathname });

  // El título de la pestaña sigue al idioma elegido.
  useEffect(() => {
    const titulo = TITULOS[ruta.replace(/\/$/, "") || "/"];
    if (titulo) document.title = idioma === "en" ? titulo[1] : titulo[0];
  }, [idioma, ruta]);

  // PWA: registra el service worker solo en producción y sobre HTTPS/localhost.
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const registrar = () => void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <a href="#contenido" className="saltar-contenido">
          {t("Saltar al contenido principal", "Skip to main content")}
        </a>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <BotonCreditos />
        <AjustesFlotantes />
        <Chatbot />
      </AppProvider>
    </QueryClientProvider>
  );
}

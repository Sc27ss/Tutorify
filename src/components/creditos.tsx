import { useState } from "react";

import { useI18n } from "@/lib/preferencias";
import { EQUIPO_BOTON, EQUIPO_IMG } from "@/lib/imagenes";

const EQUIPO = [
  { nombre: "Santiago Carvajal", icono: EQUIPO_IMG["santiago"]! },
  { nombre: "Damián Franco", icono: EQUIPO_IMG["damian"]! },
  { nombre: "Andrés Felipe Valencia", icono: EQUIPO_IMG["andres"]! },
  { nombre: "Juan Felipe Neita", icono: EQUIPO_IMG["neita"]! },
];

export function BotonCreditos() {
  const [abierto, setAbierto] = useState(false);
  const { t } = useI18n();

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 lg:bottom-24 lg:right-6">
      {abierto && (
        <div className="animate-pop w-[268px] rounded-4xl border border-border bg-card p-5 shadow-float">
          <p className="font-ui text-[0.6875rem] font-bold tracking-normal text-muted-foreground">
            {t("Creado por", "Created by")}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {EQUIPO.map((persona) => (
              <li
                key={persona.nombre}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-3 py-2"
              >
                <img src={persona.icono} alt="" aria-hidden="true" loading="lazy" className="size-9 shrink-0 rounded-xl object-contain" />
                <span className="font-display text-sm font-bold">{persona.nombre}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[0.6875rem] text-muted-foreground">
            Tutorify · Medellín, Colombia
          </p>
        </div>
      )}

      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label={t("Ver créditos del equipo", "See team credits")}
        aria-expanded={abierto}
        className="chunky grid size-14 place-items-center rounded-3xl border border-mint-deep bg-mint text-xl text-foreground shadow-card"
      >
        {abierto ? <span aria-hidden="true">✕</span> : <img src={EQUIPO_BOTON} alt="" aria-hidden="true" className="size-9 object-contain" />}
      </button>
    </div>
  );
}

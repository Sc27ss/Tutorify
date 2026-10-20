-- =====================================================================
-- Tutorify · SQL de PROFESORES (pegar completo en Supabase → SQL Editor → Run)
-- Parte 1: tabla de perfiles + función crear_profesor.  Parte 2: los 6 profesores.
-- Seguro de ejecutar varias veces. No borra ni modifica nada existente.
-- =====================================================================

-- =====================================================================
-- Tutorify · Perfiles de profesores (ciudad, formación, descripción, materias, horarios, precio)
-- Migración IDEMPOTENTE y NO destructiva: se puede ejecutar varias veces.
--  * Solo AGREGA una tabla nueva (perfiles_tutor) y una función nueva (crear_profesor).
--  * NO modifica las tablas usuarios / sesiones / solicitudes / tareas ni sus datos.
--  * NO toca contraseñas existentes.
-- Requiere haber ejecutado antes 20261019000000_tutorify_esquema.sql (tabla usuarios).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

-- ---------- Perfil público del profesor (1 fila por usuario con rol 'tutor') ----------
create table if not exists public.perfiles_tutor (
  usuario_id     uuid primary key references public.usuarios(id) on delete cascade,
  ciudad         text    not null default 'Medellín',
  titulo         text    not null default '',            -- nivel educativo / formación (ej. «Magíster en Matemáticas»)
  nivel          text    not null default 'bachillerato'
                 check (nivel in ('primaria','bachillerato','icfes','universidad')),  -- nivel al que enseña
  biografia      text    not null default '',            -- descripción corta
  materias       text[]  not null default '{}',          -- Cálculo, Física, Química, Matemáticas, Lectura Crítica, Biología
  dias           text[]  not null default '{}'
                 check (dias <@ array['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']::text[]),
  horas          text[]  not null default '{}',          -- horas de inicio, ej. {'08:00','14:00'}
  precio_hora    integer not null default 0 check (precio_hora >= 0),   -- COP por hora
  calificacion   numeric(2,1) not null default 0 check (calificacion between 0 and 5),
  total_resenas  integer not null default 0 check (total_resenas >= 0),
  creado         timestamptz not null default now(),
  actualizado    timestamptz not null default now()
);

-- Seguridad: igual que el resto de tablas (solo el servidor con la clave secreta).
alter table public.perfiles_tutor enable row level security;
revoke all on public.perfiles_tutor from anon, authenticated;
grant  all on public.perfiles_tutor to service_role;

-- ---------- Crear un profesor completo (usuario + perfil) en UNA sola transacción ----------
-- Si algo falla (correo repetido, datos inválidos…) no queda nada a medias.
create or replace function public.crear_profesor(
  p_nombre text, p_email text, p_clave text,
  p_ciudad text, p_titulo text, p_nivel text, p_biografia text,
  p_materias text[], p_dias text[], p_horas text[], p_precio integer
) returns public.usuarios
language plpgsql security definer set search_path = public, extensions as $$
declare fila public.usuarios;
begin
  if coalesce(array_length(p_materias, 1), 0) = 0 then
    raise exception 'Selecciona al menos una materia' using errcode = '22023';
  end if;
  if coalesce(array_length(p_dias, 1), 0) = 0 then
    raise exception 'Selecciona al menos un día de trabajo' using errcode = '22023';
  end if;
  if coalesce(array_length(p_horas, 1), 0) = 0 then
    raise exception 'Selecciona al menos una hora de trabajo' using errcode = '22023';
  end if;
  if p_precio is null or p_precio < 0 then
    raise exception 'Precio no válido' using errcode = '22023';
  end if;

  -- crear_usuario valida la clave (mín. 6), cifra con bcrypt y el trigger asigna tutor_id.
  fila := public.crear_usuario(p_nombre, p_email, p_clave, 'tutor', null);

  insert into public.perfiles_tutor
    (usuario_id, ciudad, titulo, nivel, biografia, materias, dias, horas, precio_hora)
  values
    (fila.id, trim(p_ciudad), trim(p_titulo), p_nivel, trim(p_biografia), p_materias, p_dias, p_horas, p_precio);

  return fila;
end; $$;

revoke execute on function public.crear_profesor(text,text,text,text,text,text,text,text[],text[],text[],integer)
  from public, anon, authenticated;
grant  execute on function public.crear_profesor(text,text,text,text,text,text,text,text[],text[],text[],integer)
  to service_role;

-- ---------- Perfiles de los 3 profesores de demostración que ya existían ----------
-- Solo se crean si esos usuarios existen (tutor_id 1, 2, 3) y si todavía no tienen perfil.
insert into public.perfiles_tutor
  (usuario_id, ciudad, titulo, nivel, biografia, materias, dias, horas, precio_hora, calificacion, total_resenas)
select u.id, v.ciudad, v.titulo, v.nivel, v.biografia, v.materias, v.dias, v.horas, v.precio, v.calificacion, v.resenas
from (values
  (1, 'Medellín', 'Magíster en Matemáticas', 'universidad',
      'Diez años enseñando cálculo y matemáticas a grado 11 y primeros semestres.',
      array['Cálculo','Matemáticas']::text[], array['Lunes','Miércoles','Viernes']::text[],
      array['08:00','10:00','16:00']::text[], 45000, 4.9, 132),
  (2, 'Medellín', 'Ingeniero Físico', 'bachillerato',
      'Física y matemáticas con método de resolución de problemas tipo ICFES.',
      array['Física','Matemáticas']::text[], array['Martes','Jueves','Sábado']::text[],
      array['10:00','14:00','18:00']::text[], 38000, 4.7, 88),
  (3, 'Medellín', 'Licenciada en Química', 'icfes',
      'Química, biología y lectura crítica enfocadas en las pruebas Saber 11.',
      array['Química','Biología','Lectura Crítica']::text[], array['Lunes','Martes','Jueves','Sábado']::text[],
      array['08:00','14:00','18:00']::text[], 30000, 4.8, 61)
) as v(tutor_id, ciudad, titulo, nivel, biografia, materias, dias, horas, precio, calificacion, resenas)
join public.usuarios u on u.tutor_id = v.tutor_id and u.rol = 'tutor'
on conflict (usuario_id) do nothing;

-- Refresca la caché de esquema de la API (PostgREST) para que la tabla y la función sean visibles.
notify pgrst, 'reload schema';


-- =====================================================================
-- Tutorify · Los 6 profesores nuevos: Liliana, Lina, Luis Ángel, Elimeleth, María Victoria y Camilo.
-- Ejecutar DESPUÉS de 20261020000000_perfiles_tutor.sql. Es IDEMPOTENTE:
--  * Si el correo ya existe, no se toca la cuenta ni su contraseña.
--  * Si el profesor ya tiene perfil, no se sobrescribe (edítalo desde el panel de administrador).
--
-- ⚠ CONTRASEÑA TEMPORAL: todos entran con la que pongas en «clave_temporal» (abajo).
--   Cámbiala antes de ejecutar, o restablécela por profesor desde Panel admin → Usuarios → 🔑.
-- Correos, ciudad, formación, descripción, días, horas y precios son EDITABLES desde
-- Panel admin → Equipo → «Editar perfil». Se dejaron valores de ejemplo realistas.
-- =====================================================================
set search_path = public, extensions;

do $$
declare
  clave_temporal constant text := 'Tutorify2026*';   -- ← CÁMBIALA
  p   record;
  uid uuid;
begin
  for p in
    select * from (values
      ('Liliana', 'liliana@tutorify.co', 'Medellín', 'Licenciada en Matemáticas', 'bachillerato',
        'Álgebra, trigonometría y geometría paso a paso, con ejercicios guiados para que pierdas el miedo a las matemáticas.',
        array['Matemáticas']::text[], array['Lunes','Miércoles','Viernes']::text[],
        array['14:00','16:00','18:00']::text[], 35000),
      ('Lina', 'lina@tutorify.co', 'Medellín', 'Química Farmacéutica', 'icfes',
        'Estequiometría, soluciones y química orgánica explicadas con ejemplos cotidianos y simulacros tipo Saber 11.',
        array['Química']::text[], array['Martes','Jueves','Sábado']::text[],
        array['08:00','10:00','14:00']::text[], 38000),
      ('Luis Ángel', 'luisangel@tutorify.co', 'Medellín', 'Ingeniero Mecánico', 'universidad',
        'Cinemática, dinámica, energía y electricidad con problemas reales y método de resolución ordenado.',
        array['Física']::text[], array['Lunes','Martes','Jueves']::text[],
        array['16:00','18:00']::text[], 42000),
      ('Elimeleth', 'elimeleth@tutorify.co', 'Medellín', 'Licenciado en Lengua Castellana', 'icfes',
        'Comprensión lectora, argumentación e inferencia con estrategias y simulacros para la prueba de Lectura Crítica.',
        array['Lectura Crítica']::text[], array['Miércoles','Viernes','Sábado']::text[],
        array['08:00','10:00','16:00']::text[], 32000),
      ('María Victoria', 'mariavictoria@tutorify.co', 'Medellín', 'Bióloga con énfasis en Genética', 'bachillerato',
        'Célula, genética y ecología con material visual y esquemas que hacen fácil estudiar biología.',
        array['Biología']::text[], array['Lunes','Martes','Viernes']::text[],
        array['10:00','14:00','16:00']::text[], 34000),
      ('Camilo', 'camilo@tutorify.co', 'Medellín', 'Ingeniero Civil · Especialista en Cálculo', 'universidad',
        'Límites, derivadas e integrales para primeros semestres, con práctica guiada y repaso previo a parciales.',
        array['Cálculo']::text[], array['Martes','Jueves','Sábado']::text[],
        array['14:00','16:00','18:00']::text[], 48000)
    ) as v(nombre, email, ciudad, titulo, nivel, biografia, materias, dias, horas, precio)
  loop
    -- Cada fila es un comando independiente: el trigger asigna el siguiente tutor_id libre (4, 5, 6…).
    insert into public.usuarios (nombre, email, password_hash, rol)
    values (p.nombre, p.email, crypt(clave_temporal, gen_salt('bf', 10)), 'tutor')
    on conflict (email) do nothing;

    select id into uid from public.usuarios where email = p.email and rol = 'tutor';

    if uid is not null then
      insert into public.perfiles_tutor
        (usuario_id, ciudad, titulo, nivel, biografia, materias, dias, horas, precio_hora)
      values
        (uid, p.ciudad, p.titulo, p.nivel, p.biografia, p.materias, p.dias, p.horas, p.precio)
      on conflict (usuario_id) do nothing;
    end if;
  end loop;
end $$;

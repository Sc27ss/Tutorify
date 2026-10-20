-- ARCHIVO GENERADO: esquema (supabase/migrations) + datos demo (supabase/seed-demo.sql). Seguro de re-ejecutar.
-- Pega TODO en Supabase → SQL Editor → New query → Run.

-- =====================================================================
-- Tutorify · Esquema para el proyecto Supabase tuieafwffqzbgxokthrb
-- Migración IDEMPOTENTE y NO destructiva: se puede ejecutar varias veces.
--  * No borra tablas, filas, funciones ni políticas existentes.
--  * No crea ni modifica contraseñas de usuarios (ver supabase/seed-demo.sql, opcional).
-- La app usa un sistema de sesión propio (tablas usuarios/sesiones) y accede SOLO desde el
-- servidor con la clave secreta. Por eso anon/authenticated no tienen ningún permiso.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

-- ---------- Usuarios ----------
create table if not exists public.usuarios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null default '',
  email         text not null unique,
  password_hash text,                       -- null para cuentas solo-Google; bcrypt en el resto
  rol           text not null default 'estudiante' check (rol in ('estudiante','tutor','admin')),
  tutor_id      integer,                    -- identificador del profesor en el catálogo (1,2,3...)
  activo        boolean not null default true,
  proveedor     text not null default 'correo' check (proveedor in ('correo','google')),
  creado        timestamptz not null default now()
);

-- ---------- Sesiones propias (cookie httpOnly con token aleatorio) ----------
create table if not exists public.sesiones (
  token      text primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  expira     timestamptz not null,
  creado     timestamptz not null default now()
);
create index if not exists sesiones_usuario_idx on public.sesiones(usuario_id);
create index if not exists sesiones_expira_idx  on public.sesiones(expira);

-- ---------- Compras / solicitudes ----------
create table if not exists public.solicitudes (
  id                uuid primary key default gen_random_uuid(),
  referencia        text not null,
  estudiante_id     uuid not null references public.usuarios(id) on delete cascade,
  estudiante_nombre text not null default '',
  materia           text not null,
  plan              text not null,
  monto             numeric not null default 0,
  dia               text not null default '',
  hora              text not null default '',
  metodo            text not null default '',
  estado            text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  tutor_id          integer,
  tutor_nombre      text,
  meet              text,
  nota              text,
  created_at        timestamptz not null default now()
);
create index if not exists solicitudes_estudiante_idx on public.solicitudes(estudiante_id);
create index if not exists solicitudes_tutor_idx      on public.solicitudes(tutor_id);

-- ---------- Tareas ----------
create table if not exists public.tareas (
  id           uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  titulo       text not null,
  descripcion  text not null default '',
  entrega      text not null default '',
  estado       text not null default 'pendiente' check (estado in ('pendiente','entregada')),
  created_at   timestamptz not null default now()
);
create index if not exists tareas_solicitud_idx on public.tareas(solicitud_id);

-- ---------- Seguridad: RLS activo y sin acceso desde el navegador ----------
-- RLS activado SIN políticas para anon/authenticated = denegado por defecto.
-- Solo service_role (clave secreta, únicamente en el servidor) puede leer/escribir.
alter table public.usuarios    enable row level security;
alter table public.sesiones    enable row level security;
alter table public.solicitudes enable row level security;
alter table public.tareas      enable row level security;
revoke all on public.usuarios, public.sesiones, public.solicitudes, public.tareas from anon, authenticated;
grant  all on public.usuarios, public.sesiones, public.solicitudes, public.tareas to service_role;

-- ---------- Normalización automática ----------
-- * El correo se guarda en minúsculas y sin espacios.
-- * Una contraseña en texto plano escrita a mano en password_hash se cifra sola con bcrypt.
-- * Si el rol es 'tutor' y no hay tutor_id, se asigna el siguiente libre. Si no es tutor, tutor_id = null.
create unique index if not exists usuarios_tutor_id_uniq on public.usuarios(tutor_id) where tutor_id is not null;

create or replace function public.usuarios_normalizar()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  new.email := lower(trim(new.email));
  if new.password_hash is not null and new.password_hash !~ '^\$2[abxy]\$[0-9]{2}\$' then
    new.password_hash := crypt(new.password_hash, gen_salt('bf', 10));
  end if;
  if new.rol = 'tutor' and new.tutor_id is null then
    perform pg_advisory_xact_lock(7001);
    select coalesce(max(tutor_id), 0) + 1 into new.tutor_id from public.usuarios;
  end if;
  if new.rol <> 'tutor' then
    new.tutor_id := null;
  end if;
  return new;
end; $$;

drop trigger if exists usuarios_normalizar_trg on public.usuarios;
create trigger usuarios_normalizar_trg
  before insert or update on public.usuarios
  for each row execute function public.usuarios_normalizar();

-- ---------- Funciones RPC usadas por el servidor ----------
create or replace function public.hash_clave(p_clave text)
returns text language sql volatile set search_path = public, extensions as $$
  select crypt(p_clave, gen_salt('bf', 10));
$$;

create or replace function public.verificar_login(p_email text, p_clave text)
returns setof public.usuarios
language sql stable security definer set search_path = public, extensions as $$
  select * from public.usuarios
  where email = lower(trim(p_email))
    and password_hash is not null
    and password_hash = crypt(p_clave, password_hash);
$$;

create or replace function public.crear_usuario(
  p_nombre text, p_email text, p_clave text, p_rol text, p_tutor_id integer default null
) returns public.usuarios
language plpgsql security definer set search_path = public, extensions as $$
declare fila public.usuarios;
begin
  if p_clave is null or length(p_clave) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres' using errcode = '22023';
  end if;
  if p_rol is null or p_rol not in ('estudiante','tutor','admin') then
    raise exception 'Rol no válido' using errcode = '22023';
  end if;
  insert into public.usuarios (nombre, email, password_hash, rol, tutor_id)
  values (trim(p_nombre), lower(trim(p_email)), crypt(p_clave, gen_salt('bf', 10)), p_rol, p_tutor_id)
  returning * into fila;
  return fila;
end; $$;

create or replace function public.cambiar_clave(p_id uuid, p_clave text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_clave is null or length(p_clave) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres' using errcode = '22023';
  end if;
  update public.usuarios set password_hash = crypt(p_clave, gen_salt('bf', 10)) where id = p_id;
end; $$;

-- Limpieza opcional de sesiones caducadas (se puede ejecutar a mano o programar con pg_cron).
create or replace function public.limpiar_sesiones()
returns integer language sql security definer set search_path = public as $$
  with borradas as (delete from public.sesiones where expira < now() returning 1)
  select count(*)::integer from borradas;
$$;

-- Ninguna función RPC es invocable desde el navegador: solo el servidor (service_role).
revoke execute on function public.hash_clave(text), public.verificar_login(text,text),
  public.crear_usuario(text,text,text,text,integer), public.cambiar_clave(uuid,text),
  public.limpiar_sesiones()
  from public, anon, authenticated;
grant execute on function public.hash_clave(text), public.verificar_login(text,text),
  public.crear_usuario(text,text,text,text,integer), public.cambiar_clave(uuid,text),
  public.limpiar_sesiones()
  to service_role;

-- Refresca la caché de esquema de la API (PostgREST) para que las funciones nuevas sean visibles.
notify pgrst, 'reload schema';


set search_path = public, extensions;

insert into public.usuarios (nombre, email, password_hash, rol, tutor_id) values
  ('Administrador',  'admin@gmail.com',    crypt('admin123', gen_salt('bf', 10)), 'admin', null),
  ('Laura Gómez',    'laura@tutorify.co',  crypt('tutor123', gen_salt('bf', 10)), 'tutor', 1),
  ('Carlos Ramírez', 'carlos@tutorify.co', crypt('tutor123', gen_salt('bf', 10)), 'tutor', 2),
  ('Ana Torres',     'ana@tutorify.co',    crypt('tutor123', gen_salt('bf', 10)), 'tutor', 3)
on conflict do nothing;


-- ===== Perfiles de profesores =====

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

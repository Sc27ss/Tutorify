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

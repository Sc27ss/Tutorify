-- =====================================================================
-- Tutorify · Datos de DEMOSTRACIÓN (OPCIONAL). Ejecutar DESPUÉS de la migración de esquema.
-- No sobrescribe nada: si el correo ya existe, se deja intacto (no resetea contraseñas).
-- ⚠ Estas contraseñas son públicas (están en el README). Si publicas la app, cambia la del
--   administrador desde el panel o elimina estas cuentas.
-- =====================================================================
set search_path = public, extensions;

insert into public.usuarios (nombre, email, password_hash, rol, tutor_id) values
  ('Administrador',  'admin@gmail.com',    crypt('admin123', gen_salt('bf', 10)), 'admin', null),
  ('Laura Gómez',    'laura@tutorify.co',  crypt('tutor123', gen_salt('bf', 10)), 'tutor', 1),
  ('Carlos Ramírez', 'carlos@tutorify.co', crypt('tutor123', gen_salt('bf', 10)), 'tutor', 2),
  ('Ana Torres',     'ana@tutorify.co',    crypt('tutor123', gen_salt('bf', 10)), 'tutor', 3)
on conflict do nothing;

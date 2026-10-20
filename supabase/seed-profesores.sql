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

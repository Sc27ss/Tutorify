CREATE TYPE public.app_role AS ENUM ('estudiante','tutor','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  tutor_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.mi_tutor_id()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tutor_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia text NOT NULL,
  estudiante_id uuid NOT NULL,
  estudiante_nombre text NOT NULL DEFAULT '',
  materia text NOT NULL,
  plan text NOT NULL,
  monto numeric NOT NULL DEFAULT 0,
  dia text NOT NULL DEFAULT '',
  hora text NOT NULL DEFAULT '',
  metodo text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'pendiente',
  tutor_id integer,
  tutor_nombre text,
  meet text,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes TO authenticated;
GRANT ALL ON public.solicitudes TO service_role;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text NOT NULL DEFAULT '',
  entrega text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tareas TO authenticated;
GRANT ALL ON public.tareas TO service_role;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_solicitudes_updated BEFORE UPDATE ON public.solicitudes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tareas_updated BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- profiles
CREATE POLICY "perfil propio visible" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tutor'));
CREATE POLICY "crear perfil propio" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "editar perfil propio" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "ver roles propios" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "autoregistro solo estudiante" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'estudiante');

-- solicitudes
CREATE POLICY "ver solicitudes segun rol" ON public.solicitudes FOR SELECT TO authenticated
  USING (
    estudiante_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'tutor') AND tutor_id IS NOT NULL AND tutor_id = public.mi_tutor_id())
  );
CREATE POLICY "estudiante crea solicitud" ON public.solicitudes FOR INSERT TO authenticated
  WITH CHECK (estudiante_id = auth.uid() AND estado = 'pendiente');
CREATE POLICY "admin gestiona solicitudes" ON public.solicitudes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin borra solicitudes" ON public.solicitudes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- tareas
CREATE POLICY "ver tareas segun rol" ON public.tareas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.solicitudes s WHERE s.id = tareas.solicitud_id AND (
      s.estudiante_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR (public.has_role(auth.uid(),'tutor') AND s.tutor_id = public.mi_tutor_id())
    )
  ));
CREATE POLICY "tutor crea tareas" ON public.tareas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.solicitudes s WHERE s.id = tareas.solicitud_id AND (
      public.has_role(auth.uid(),'admin')
      OR (public.has_role(auth.uid(),'tutor') AND s.tutor_id = public.mi_tutor_id())
    )
  ));
CREATE POLICY "actualizar tareas" ON public.tareas FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.solicitudes s WHERE s.id = tareas.solicitud_id AND (
      s.estudiante_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR (public.has_role(auth.uid(),'tutor') AND s.tutor_id = public.mi_tutor_id())
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.solicitudes s WHERE s.id = tareas.solicitud_id AND (
      s.estudiante_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR (public.has_role(auth.uid(),'tutor') AND s.tutor_id = public.mi_tutor_id())
    )
  ));
CREATE POLICY "tutor borra tareas" ON public.tareas FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.solicitudes s WHERE s.id = tareas.solicitud_id AND (
      public.has_role(auth.uid(),'admin')
      OR (public.has_role(auth.uid(),'tutor') AND s.tutor_id = public.mi_tutor_id())
    )
  ));
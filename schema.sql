-- ============================================================
-- TutorAula - Plataforma de Tutorías Académicas Escolares
-- Script completo de base de datos (MySQL 8 / MariaDB)
-- ============================================================

DROP DATABASE IF EXISTS tutoraula;
CREATE DATABASE tutoraula CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tutoraula;

-- ------------------------------------------------------------
-- RF-01: Usuarios (Estudiante / Tutor)
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL,
  email             VARCHAR(180)  NOT NULL,
  password_hash     VARCHAR(255)  NOT NULL,
  rol               ENUM('estudiante','tutor','admin') NOT NULL DEFAULT 'estudiante',
  telefono          VARCHAR(30)   NULL,
  ciudad            VARCHAR(90)   NULL,
  nivel_educativo   ENUM('primaria','bachillerato','icfes','universidad') NULL,
  titulo_profesional VARCHAR(150) NULL,
  biografia         TEXT          NULL,
  foto_url          VARCHAR(255)  NULL,
  precio_hora       DECIMAL(10,2) NULL,
  calificacion_prom DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
  total_resenas     INT           NOT NULL DEFAULT 0,
  verificado        TINYINT(1)    NOT NULL DEFAULT 0,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT chk_precio_hora   CHECK (precio_hora IS NULL OR precio_hora >= 0),
  CONSTRAINT chk_calificacion  CHECK (calificacion_prom BETWEEN 0 AND 5)
) ENGINE=InnoDB;

CREATE INDEX idx_usuarios_rol    ON usuarios(rol);
CREATE INDEX idx_usuarios_precio ON usuarios(precio_hora);

-- ------------------------------------------------------------
-- Materias
-- ------------------------------------------------------------
CREATE TABLE materias (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  area      ENUM('exactas','ciencias','humanidades','idiomas','tecnologia') NOT NULL,
  icono     VARCHAR(20)  NULL,
  CONSTRAINT uq_materias_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Relación N:M tutor <-> materia
-- ------------------------------------------------------------
CREATE TABLE tutor_materias (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id      INT NOT NULL,
  materia_id    INT NOT NULL,
  anios_experiencia INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_tm_tutor   FOREIGN KEY (tutor_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  CONSTRAINT uq_tutor_materia UNIQUE (tutor_id, materia_id),
  CONSTRAINT chk_anios CHECK (anios_experiencia >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- RF-03: Disponibilidad de agenda del tutor
-- ------------------------------------------------------------
CREATE TABLE disponibilidad (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id   INT NOT NULL,
  dia_semana ENUM('lunes','martes','miercoles','jueves','viernes','sabado','domingo') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  ocupado     TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_disp_tutor FOREIGN KEY (tutor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT chk_rango_horas CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- RF-03 / RF-05: Tutorías agendadas
-- ------------------------------------------------------------
CREATE TABLE tutorias (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  tutor_id      INT NOT NULL,
  materia_id    INT NOT NULL,
  fecha         DATE NOT NULL,
  hora_inicio   TIME NOT NULL,
  duracion_min  INT  NOT NULL DEFAULT 60,
  modalidad     ENUM('virtual','presencial') NOT NULL DEFAULT 'virtual',
  sala_url      VARCHAR(255) NULL,
  estado        ENUM('pendiente','confirmada','en_curso','finalizada','cancelada')
                NOT NULL DEFAULT 'pendiente',
  precio_total  DECIMAL(10,2) NOT NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tut_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_tut_tutor      FOREIGN KEY (tutor_id)      REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_tut_materia    FOREIGN KEY (materia_id)    REFERENCES materias(id),
  CONSTRAINT uq_agenda_tutor   UNIQUE (tutor_id, fecha, hora_inicio),
  CONSTRAINT chk_duracion      CHECK (duracion_min BETWEEN 30 AND 240),
  CONSTRAINT chk_precio_total  CHECK (precio_total >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_tutorias_estado ON tutorias(estado);
CREATE INDEX idx_tutorias_fecha  ON tutorias(fecha);

-- ------------------------------------------------------------
-- RF-04: Pagos (pasarela simulada)
-- ------------------------------------------------------------
CREATE TABLE pagos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  tutoria_id     INT NOT NULL,
  estudiante_id  INT NOT NULL,
  monto          DECIMAL(10,2) NOT NULL,
  metodo         ENUM('tarjeta','pse','nequi','daviplata') NOT NULL DEFAULT 'tarjeta',
  referencia     VARCHAR(60) NOT NULL,
  ultimos4       CHAR(4) NULL,
  estado         ENUM('pendiente','aprobado','rechazado','reembolsado') NOT NULL DEFAULT 'pendiente',
  procesado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pago_tutoria    FOREIGN KEY (tutoria_id)    REFERENCES tutorias(id) ON DELETE CASCADE,
  CONSTRAINT fk_pago_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uq_pago_referencia UNIQUE (referencia),
  CONSTRAINT chk_monto CHECK (monto >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- RF-06: Reseñas y calificaciones
-- ------------------------------------------------------------
CREATE TABLE resenas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tutoria_id    INT NOT NULL,
  estudiante_id INT NOT NULL,
  tutor_id      INT NOT NULL,
  puntuacion    TINYINT NOT NULL,
  comentario    TEXT NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_tutoria    FOREIGN KEY (tutoria_id)    REFERENCES tutorias(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_tutor      FOREIGN KEY (tutor_id)      REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uq_resena_tutoria UNIQUE (tutoria_id),
  CONSTRAINT chk_puntuacion CHECK (puntuacion BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

INSERT INTO materias (nombre, area, icono) VALUES
  ('Cálculo Integral', 'exactas', 'sigma'),
  ('Cálculo Diferencial', 'exactas', 'function'),
  ('Álgebra', 'exactas', 'x'),
  ('Física Mecánica', 'ciencias', 'atom'),
  ('Química', 'ciencias', 'flask'),
  ('Biología', 'ciencias', 'leaf'),
  ('Lectura Crítica', 'humanidades', 'book'),
  ('Historia', 'humanidades', 'scroll'),
  ('Inglés', 'idiomas', 'globe'),
  ('Programación', 'tecnologia', 'code');

-- Password de prueba para todos: "Tutoria2026*" (hash bcrypt de ejemplo)
INSERT INTO usuarios
  (nombre, email, password_hash, rol, telefono, ciudad, nivel_educativo, titulo_profesional, biografia, precio_hora, calificacion_prom, total_resenas, verificado)
VALUES
  ('Laura Gómez',    'laura.tutor@tutoraula.co',  '$2b$10$Xk3sQeR7uY1oP9aZbC5dLuJ8mN2vT4wS6xH0yG3fD1kR7pQ9sB2mC', 'tutor', '3001234567', 'Bogotá',    'universidad',  'Magíster en Matemáticas',        'Diez años enseñando cálculo a estudiantes de grado 11 y primeros semestres.', 45000.00, 4.90, 132, 1),
  ('Carlos Ramírez', 'carlos.tutor@tutoraula.co', '$2b$10$Xk3sQeR7uY1oP9aZbC5dLuJ8mN2vT4wS6xH0yG3fD1kR7pQ9sB2mC', 'tutor', '3009876543', 'Medellín',  'universidad',  'Ingeniero Físico',               'Especialista en física mecánica y preparación ICFES con método de problemas.', 38000.00, 4.70, 88,  1),
  ('Ana Torres',     'ana.tutor@tutoraula.co',    '$2b$10$Xk3sQeR7uY1oP9aZbC5dLuJ8mN2vT4wS6xH0yG3fD1kR7pQ9sB2mC', 'tutor', '3105551122', 'Cali',      'bachillerato', 'Licenciada en Química',          'Acompaño a estudiantes de bachillerato en química y biología desde cero.',    30000.00, 4.80, 61,  1),
  ('Miguel Sánchez', 'miguel.tutor@tutoraula.co', '$2b$10$Xk3sQeR7uY1oP9aZbC5dLuJ8mN2vT4wS6xH0yG3fD1kR7pQ9sB2mC', 'tutor', '3117778899', 'Barranquilla','icfes',      'Licenciado en Lenguas',          'Lectura crítica e inglés enfocados en pruebas Saber 11.',                      27000.00, 4.60, 45,  1),
  ('Daniela Ruiz',   'daniela.tutor@tutoraula.co','$2b$10$Xk3sQeR7uY1oP9aZbC5dLuJ8mN2vT4wS6xH0yG3fD1kR7pQ9sB2mC', 'tutor', '3123334455', 'Bogotá',    'universidad',  'Ingeniera de Sistemas',          'Programación desde lógica básica hasta estructuras de datos.',                 52000.00, 5.00, 74,  1),
  ('Sofía Herrera',  'sofia@correo.com',          '$2b$10$Xk3sQeR7uY1oP9aZbC5dLuJ8mN2vT4wS6xH0yG3fD1kR7pQ9sB2mC', 'estudiante', '3145556677', 'Bogotá', 'bachillerato', NULL, NULL, NULL, 0.00, 0, 0),
  ('Julián Castro',  'julian@correo.com',         '$2b$10$Xk3sQeR7uY1oP9aZbC5dLuJ8mN2vT4wS6xH0yG3fD1kR7pQ9sB2mC', 'estudiante', '3156667788', 'Cali',   'icfes',        NULL, NULL, NULL, 0.00, 0, 0);

INSERT INTO tutor_materias (tutor_id, materia_id, anios_experiencia) VALUES
  (1, 1, 10), (1, 2, 10), (1, 3, 8),
  (2, 4, 7),  (2, 1, 5),
  (3, 5, 6),  (3, 6, 4),
  (4, 7, 9),  (4, 9, 6),
  (5, 10, 8), (5, 3, 3);

INSERT INTO disponibilidad (tutor_id, dia_semana, hora_inicio, hora_fin) VALUES
  (1, 'lunes',     '08:00:00', '12:00:00'),
  (1, 'miercoles', '14:00:00', '18:00:00'),
  (2, 'martes',    '09:00:00', '13:00:00'),
  (3, 'jueves',    '15:00:00', '19:00:00'),
  (4, 'viernes',   '10:00:00', '14:00:00'),
  (5, 'sabado',    '08:00:00', '12:00:00');

INSERT INTO tutorias (estudiante_id, tutor_id, materia_id, fecha, hora_inicio, duracion_min, modalidad, sala_url, estado, precio_total) VALUES
  (6, 1, 1, '2026-08-10', '09:00:00', 60, 'virtual', 'https://meet.tutoraula.co/sala-a1b2c3', 'finalizada', 45000.00),
  (7, 4, 7, '2026-08-11', '11:00:00', 90, 'virtual', 'https://meet.tutoraula.co/sala-d4e5f6', 'confirmada', 40500.00),
  (6, 5, 10,'2026-08-15', '08:00:00', 60, 'virtual', 'https://meet.tutoraula.co/sala-g7h8i9', 'pendiente',  52000.00);

INSERT INTO pagos (tutoria_id, estudiante_id, monto, metodo, referencia, ultimos4, estado) VALUES
  (1, 6, 45000.00, 'tarjeta', 'TA-2026-000001', '4242', 'aprobado'),
  (2, 7, 40500.00, 'pse',     'TA-2026-000002', NULL,   'aprobado'),
  (3, 6, 52000.00, 'nequi',   'TA-2026-000003', NULL,   'pendiente');

INSERT INTO resenas (tutoria_id, estudiante_id, tutor_id, puntuacion, comentario) VALUES
  (1, 6, 1, 5, 'Laura explica el cálculo integral con ejemplos clarísimos. Pasé de 2.8 a 4.5.'),
  (2, 7, 4, 5, 'Excelente preparación para lectura crítica del ICFES, muy puntual y organizado.');

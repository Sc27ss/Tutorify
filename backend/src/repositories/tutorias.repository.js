/** Capa de acceso a datos: tabla tutorias. */
const pool = require("../config/database");

async function existeChoque(tutorId, fecha, horaInicio) {
  const [filas] = await pool.query(
    "SELECT id FROM tutorias WHERE tutor_id = ? AND fecha = ? AND hora_inicio = ? AND estado <> 'cancelada'",
    [tutorId, fecha, horaInicio]
  );
  return filas.length > 0;
}

async function crear(datos) {
  const [result] = await pool.query(
    `INSERT INTO tutorias (estudiante_id, tutor_id, materia_id, fecha, hora_inicio, duracion_min, modalidad, sala_url, estado, precio_total)
     VALUES (?,?,?,?,?,?,?,?, 'pendiente', ?)`,
    [
      datos.estudiante_id,
      datos.tutor_id,
      datos.materia_id,
      datos.fecha,
      datos.hora_inicio,
      datos.duracion_min,
      datos.modalidad,
      datos.sala_url,
      datos.precio_total,
    ]
  );
  return result.insertId;
}

async function porId(id) {
  const [filas] = await pool.query(
    "SELECT id, tutor_id, estudiante_id, estado, precio_total, sala_url FROM tutorias WHERE id = ?",
    [id]
  );
  return filas[0] || null;
}

async function listarPorUsuario(usuarioId, rol) {
  const campo = rol === "tutor" ? "t.tutor_id" : "t.estudiante_id";
  const [tutorias] = await pool.query(
    `SELECT t.*, m.nombre AS materia, ue.nombre AS estudiante, ut.nombre AS tutor
     FROM tutorias t
     JOIN materias m ON m.id = t.materia_id
     JOIN usuarios ue ON ue.id = t.estudiante_id
     JOIN usuarios ut ON ut.id = t.tutor_id
     WHERE ${campo} = ?
     ORDER BY t.fecha DESC, t.hora_inicio DESC`,
    [usuarioId]
  );
  return tutorias;
}

module.exports = { existeChoque, crear, porId, listarPorUsuario };

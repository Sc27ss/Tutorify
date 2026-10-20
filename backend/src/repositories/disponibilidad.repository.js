/** Capa de acceso a datos: tabla disponibilidad. */
const pool = require("../config/database");

async function listarPorTutor(tutorId) {
  const [slots] = await pool.query(
    `SELECT id, dia_semana, hora_inicio, hora_fin, ocupado
     FROM disponibilidad WHERE tutor_id = ?
     ORDER BY FIELD(dia_semana,'lunes','martes','miercoles','jueves','viernes','sabado','domingo'), hora_inicio`,
    [tutorId]
  );
  return slots;
}

async function crear(tutorId, { dia_semana, hora_inicio, hora_fin }) {
  const [result] = await pool.query(
    "INSERT INTO disponibilidad (tutor_id, dia_semana, hora_inicio, hora_fin) VALUES (?,?,?,?)",
    [tutorId, dia_semana, hora_inicio, hora_fin]
  );
  return result.insertId;
}

module.exports = { listarPorTutor, crear };

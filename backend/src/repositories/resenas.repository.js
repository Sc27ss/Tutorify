/** Capa de acceso a datos: tabla resenas. */
const pool = require("../config/database");

async function listarPorTutor(tutorId) {
  const [resenas] = await pool.query(
    `SELECT r.id, r.puntuacion, r.comentario, r.creado_en, u.nombre AS estudiante
     FROM resenas r JOIN usuarios u ON u.id = r.estudiante_id
     WHERE r.tutor_id = ? ORDER BY r.creado_en DESC`,
    [tutorId]
  );
  return resenas;
}

async function listarDestacadas(limite = 6) {
  const [resenas] = await pool.query(
    `SELECT r.puntuacion, r.comentario, ue.nombre AS estudiante, ut.nombre AS tutor
     FROM resenas r
     JOIN usuarios ue ON ue.id = r.estudiante_id
     JOIN usuarios ut ON ut.id = r.tutor_id
     WHERE r.puntuacion >= 4 ORDER BY r.creado_en DESC LIMIT ?`,
    [limite]
  );
  return resenas;
}

/** Inserta la reseña y recalcula el promedio del tutor en una transacción. */
async function crearYRecalcular({ tutoriaId, estudianteId, tutorId, puntuacion, comentario }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query(
      "INSERT INTO resenas (tutoria_id, estudiante_id, tutor_id, puntuacion, comentario) VALUES (?,?,?,?,?)",
      [tutoriaId, estudianteId, tutorId, puntuacion, comentario || null]
    );
    await conexion.query(
      `UPDATE usuarios u SET
         u.calificacion_prom = (SELECT ROUND(AVG(puntuacion),2) FROM resenas WHERE tutor_id = u.id),
         u.total_resenas = (SELECT COUNT(*) FROM resenas WHERE tutor_id = u.id)
       WHERE u.id = ?`,
      [tutorId]
    );
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

module.exports = { listarPorTutor, listarDestacadas, crearYRecalcular };

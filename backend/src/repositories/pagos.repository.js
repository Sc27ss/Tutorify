/** Capa de acceso a datos: tabla pagos (transaccional). */
const pool = require("../config/database");

/**
 * Registra el pago aprobado y confirma la tutoría dentro de una transacción.
 */
async function registrarPagoYConfirmar({ tutoriaId, estudianteId, monto, metodo, referencia, ultimos4 }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query(
      "INSERT INTO pagos (tutoria_id, estudiante_id, monto, metodo, referencia, ultimos4, estado) VALUES (?,?,?,?,?,?, 'aprobado')",
      [tutoriaId, estudianteId, monto, metodo, referencia, ultimos4]
    );
    await conexion.query("UPDATE tutorias SET estado = 'confirmada' WHERE id = ?", [tutoriaId]);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

module.exports = { registrarPagoYConfirmar };

/** Capa de acceso a datos: tabla materias. */
const pool = require("../config/database");

async function listar() {
  const [materias] = await pool.query(
    "SELECT id, nombre, area, icono FROM materias ORDER BY nombre"
  );
  return materias;
}

module.exports = { listar };

/** Capa de acceso a datos: tabla usuarios. */
const pool = require("../config/database");

async function buscarPorEmail(email) {
  const [filas] = await pool.query(
    "SELECT id, nombre, email, rol, password_hash, activo FROM usuarios WHERE email = ?",
    [email]
  );
  return filas[0] || null;
}

async function existeEmail(email) {
  const [filas] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
  return filas.length > 0;
}

async function crear(datos) {
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, ciudad, nivel_educativo, titulo_profesional, biografia, precio_hora)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      datos.nombre,
      datos.email,
      datos.password_hash,
      datos.rol,
      datos.telefono || null,
      datos.ciudad || null,
      datos.nivel_educativo || null,
      datos.titulo_profesional || null,
      datos.biografia || null,
      datos.precio_hora ?? null,
    ]
  );
  return result.insertId;
}

async function perfilPorId(id) {
  const [filas] = await pool.query(
    "SELECT id, nombre, email, rol, ciudad, nivel_educativo, precio_hora, calificacion_prom FROM usuarios WHERE id = ?",
    [id]
  );
  return filas[0] || null;
}

async function tutorPorId(id) {
  const [filas] = await pool.query(
    "SELECT id, precio_hora FROM usuarios WHERE id = ? AND rol = 'tutor'",
    [id]
  );
  return filas[0] || null;
}

async function buscarTutores(filtros) {
  const condiciones = ["u.rol = 'tutor'", "u.activo = 1"];
  const params = [];

  if (filtros.materia) { condiciones.push("m.nombre = ?"); params.push(filtros.materia); }
  if (filtros.nivel) { condiciones.push("u.nivel_educativo = ?"); params.push(filtros.nivel); }
  if (filtros.precio_min) { condiciones.push("u.precio_hora >= ?"); params.push(Number(filtros.precio_min)); }
  if (filtros.precio_max) { condiciones.push("u.precio_hora <= ?"); params.push(Number(filtros.precio_max)); }
  if (filtros.calificacion_min) { condiciones.push("u.calificacion_prom >= ?"); params.push(Number(filtros.calificacion_min)); }
  if (filtros.q) {
    condiciones.push("(u.nombre LIKE ? OR u.biografia LIKE ?)");
    params.push(`%${filtros.q}%`, `%${filtros.q}%`);
  }

  const [tutores] = await pool.query(
    `SELECT u.id, u.nombre, u.ciudad, u.nivel_educativo, u.titulo_profesional, u.biografia,
            u.precio_hora, u.calificacion_prom, u.total_resenas, u.foto_url,
            GROUP_CONCAT(DISTINCT m.nombre ORDER BY m.nombre SEPARATOR ', ') AS materias
     FROM usuarios u
     LEFT JOIN tutor_materias tm ON tm.tutor_id = u.id
     LEFT JOIN materias m ON m.id = tm.materia_id
     WHERE ${condiciones.join(" AND ")}
     GROUP BY u.id
     ORDER BY u.calificacion_prom DESC, u.total_resenas DESC`,
    params
  );
  return tutores;
}

module.exports = {
  buscarPorEmail,
  existeEmail,
  crear,
  perfilPorId,
  tutorPorId,
  buscarTutores,
};

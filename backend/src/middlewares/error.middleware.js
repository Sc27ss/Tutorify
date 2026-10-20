/** Manejo centralizado de 404 y errores. */
function noEncontrado(_req, res) {
  res.status(404).json({ error: "Recurso no encontrado" });
}

function manejadorErrores(error, _req, res, _next) {
  if (error && error.status) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[Tutorify]", error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

module.exports = { noEncontrado, manejadorErrores };

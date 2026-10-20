/** Capa HTTP: catálogo de materias. */
const tutoresService = require("../services/tutores.service");

async function listar(_req, res) {
  res.json(await tutoresService.listarMaterias());
}

module.exports = { listar };

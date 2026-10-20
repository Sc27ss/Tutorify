/** Capa HTTP: RF-03 agenda del tutor. */
const disponibilidadService = require("../services/disponibilidad.service");

async function crear(req, res) {
  const slot = await disponibilidadService.crear(req.usuario.id, req.body);
  res.status(201).json(slot);
}

module.exports = { crear };

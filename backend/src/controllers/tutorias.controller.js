/** Capa HTTP: RF-03 + RF-05 reservas. */
const tutoriasService = require("../services/tutorias.service");

async function crear(req, res) {
  const reserva = await tutoriasService.reservar(req.usuario.id, req.body);
  res.status(201).json(reserva);
}

async function mias(req, res) {
  res.json(await tutoriasService.listarMias(req.usuario.id, req.usuario.rol));
}

module.exports = { crear, mias };

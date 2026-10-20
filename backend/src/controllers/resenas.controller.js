/** Capa HTTP: RF-06 reseñas. */
const resenasService = require("../services/resenas.service");

async function crear(req, res) {
  const resultado = await resenasService.crear(req.usuario.id, req.body);
  res.status(201).json(resultado);
}

async function destacadas(_req, res) {
  res.json(await resenasService.listarDestacadas());
}

module.exports = { crear, destacadas };

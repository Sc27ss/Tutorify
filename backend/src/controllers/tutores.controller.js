/** Capa HTTP: RF-02 búsqueda de tutores, agenda y reseñas públicas. */
const tutoresService = require("../services/tutores.service");
const disponibilidadService = require("../services/disponibilidad.service");
const resenasService = require("../services/resenas.service");

async function buscar(req, res) {
  res.json(await tutoresService.buscarTutores(req.query));
}

async function disponibilidad(req, res) {
  res.json(await disponibilidadService.listarPorTutor(req.params.id));
}

async function resenas(req, res) {
  res.json(await resenasService.listarPorTutor(req.params.id));
}

module.exports = { buscar, disponibilidad, resenas };

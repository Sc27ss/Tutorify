/** Lógica de negocio: RF-03 agenda del tutor. */
const repo = require("../repositories/disponibilidad.repository");
const ApiError = require("../utils/ApiError");
const { DIAS } = require("../utils/validadores");

const listarPorTutor = (tutorId) => repo.listarPorTutor(tutorId);

async function crear(tutorId, datos) {
  const { dia_semana, hora_inicio, hora_fin } = datos;
  if (!DIAS.includes(dia_semana)) throw ApiError.badRequest("Día inválido");
  if (!hora_inicio || !hora_fin || hora_fin <= hora_inicio) {
    throw ApiError.badRequest("Rango horario inválido");
  }
  const id = await repo.crear(tutorId, datos);
  return { id, dia_semana, hora_inicio, hora_fin };
}

module.exports = { listarPorTutor, crear };

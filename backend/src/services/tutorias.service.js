/** Lógica de negocio: RF-03 + RF-05 reservas y sala virtual. */
const tutorias = require("../repositories/tutorias.repository");
const usuarios = require("../repositories/usuarios.repository");
const ApiError = require("../utils/ApiError");
const { generarSala } = require("../utils/generadores");

async function reservar(estudianteId, datos) {
  const { tutor_id, materia_id, fecha, hora_inicio, duracion_min = 60, modalidad = "virtual" } = datos;
  if (!tutor_id || !materia_id || !fecha || !hora_inicio) {
    throw ApiError.badRequest("Datos de la reserva incompletos");
  }

  const tutor = await usuarios.tutorPorId(tutor_id);
  if (!tutor) throw ApiError.notFound("Tutor no encontrado");

  if (await tutorias.existeChoque(tutor_id, fecha, hora_inicio)) {
    throw ApiError.conflict("El horario ya está reservado");
  }

  const precio_total = Number(tutor.precio_hora) * (Number(duracion_min) / 60);
  const sala_url = modalidad === "virtual" ? generarSala() : null;

  const id = await tutorias.crear({
    estudiante_id: estudianteId,
    tutor_id,
    materia_id,
    fecha,
    hora_inicio,
    duracion_min,
    modalidad,
    sala_url,
    precio_total,
  });

  return { id, estado: "pendiente", precio_total, sala_url };
}

const listarMias = (usuarioId, rol) => tutorias.listarPorUsuario(usuarioId, rol);

module.exports = { reservar, listarMias };

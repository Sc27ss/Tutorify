/** Lógica de negocio: RF-06 reseñas y calificaciones. */
const resenas = require("../repositories/resenas.repository");
const tutorias = require("../repositories/tutorias.repository");
const ApiError = require("../utils/ApiError");

const listarPorTutor = (tutorId) => resenas.listarPorTutor(tutorId);
const listarDestacadas = () => resenas.listarDestacadas(6);

async function crear(estudianteId, { tutoria_id, puntuacion, comentario }) {
  const nota = Number(puntuacion);
  if (!tutoria_id) throw ApiError.badRequest("Tutoría requerida");
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw ApiError.badRequest("La puntuación debe estar entre 1 y 5");
  }
  if (comentario && comentario.length > 1000) {
    throw ApiError.badRequest("Comentario demasiado extenso");
  }

  const tutoria = await tutorias.porId(tutoria_id);
  if (!tutoria) throw ApiError.notFound("Tutoría no encontrada");
  if (tutoria.estudiante_id !== estudianteId) throw ApiError.forbidden("No autorizado");
  if (tutoria.estado !== "finalizada") {
    throw ApiError.conflict("Solo puedes reseñar tutorías finalizadas");
  }

  try {
    await resenas.crearYRecalcular({
      tutoriaId: tutoria.id,
      estudianteId,
      tutorId: tutoria.tutor_id,
      puntuacion: nota,
      comentario,
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict("Esta tutoría ya tiene reseña");
    }
    throw error;
  }

  return { mensaje: "Reseña registrada" };
}

module.exports = { listarPorTutor, listarDestacadas, crear };

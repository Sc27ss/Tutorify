/** Lógica de negocio: RF-04 pasarela de pagos simulada. */
const pagos = require("../repositories/pagos.repository");
const tutorias = require("../repositories/tutorias.repository");
const ApiError = require("../utils/ApiError");
const { generarReferencia } = require("../utils/generadores");
const { METODOS_PAGO } = require("../utils/validadores");

async function procesar(estudianteId, { tutoria_id, metodo = "tarjeta", numero_tarjeta }) {
  if (!tutoria_id) throw ApiError.badRequest("Tutoría requerida");
  if (!METODOS_PAGO.includes(metodo)) throw ApiError.badRequest("Método de pago inválido");

  const tutoria = await tutorias.porId(tutoria_id);
  if (!tutoria) throw ApiError.notFound("Tutoría no encontrada");
  if (tutoria.estudiante_id !== estudianteId) throw ApiError.forbidden("No autorizado");

  let ultimos4 = null;
  if (metodo === "tarjeta") {
    const digitos = String(numero_tarjeta || "").replace(/\D/g, "");
    if (digitos.length < 15 || digitos.length > 16) {
      throw ApiError.badRequest("Número de tarjeta inválido");
    }
    ultimos4 = digitos.slice(-4);
  }

  const referencia = generarReferencia();
  await pagos.registrarPagoYConfirmar({
    tutoriaId: tutoria.id,
    estudianteId,
    monto: tutoria.precio_total,
    metodo,
    referencia,
    ultimos4,
  });

  return {
    referencia,
    estado: "aprobado",
    monto: tutoria.precio_total,
    sala_url: tutoria.sala_url,
  };
}

module.exports = { procesar };

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const METODOS_PAGO = ["tarjeta", "pse", "nequi", "daviplata"];
const ROLES_REGISTRO = ["estudiante", "tutor"];

function esEmailValido(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

module.exports = { DIAS, METODOS_PAGO, ROLES_REGISTRO, esEmailValido, normalizarEmail };

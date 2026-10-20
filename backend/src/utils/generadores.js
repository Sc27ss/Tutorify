const crypto = require("crypto");
const { MEET_BASE_URL } = require("../config/env");

/** Genera la URL de la sala virtual de una tutoría. */
function generarSala() {
  return `${MEET_BASE_URL}/sala-${crypto.randomBytes(4).toString("hex")}`;
}

/** Genera la referencia única de un pago. */
function generarReferencia() {
  return `TA-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

module.exports = { generarSala, generarReferencia };

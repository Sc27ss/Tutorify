/** Capa HTTP: RF-04 pagos. */
const pagosService = require("../services/pagos.service");

async function crear(req, res) {
  const pago = await pagosService.procesar(req.usuario.id, req.body);
  res.status(201).json(pago);
}

module.exports = { crear };

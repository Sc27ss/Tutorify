/** Capa HTTP: RF-01 Autenticación. */
const authService = require("../services/auth.service");

async function registro(req, res) {
  const resultado = await authService.registrar(req.body);
  res.status(201).json(resultado);
}

async function login(req, res) {
  res.json(await authService.iniciarSesion(req.body.email, req.body.password));
}

async function perfil(req, res) {
  res.json(await authService.perfil(req.usuario.id));
}

module.exports = { registro, login, perfil };

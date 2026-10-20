/** Lógica de negocio: RF-01 Autenticación. */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");
const usuarios = require("../repositories/usuarios.repository");
const ApiError = require("../utils/ApiError");
const { esEmailValido, normalizarEmail, ROLES_REGISTRO } = require("../utils/validadores");

function firmarToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol, email: usuario.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function registrar(datos) {
  const { nombre, email, password, rol, precio_hora } = datos;

  if (!nombre || nombre.trim().length < 3) throw ApiError.badRequest("Nombre inválido");
  if (!esEmailValido(email)) throw ApiError.badRequest("Correo inválido");
  if (!password || password.length < 8) {
    throw ApiError.badRequest("La contraseña debe tener al menos 8 caracteres");
  }
  if (!ROLES_REGISTRO.includes(rol)) throw ApiError.badRequest("Rol inválido");
  if (rol === "tutor" && (precio_hora === undefined || Number(precio_hora) <= 0)) {
    throw ApiError.badRequest("El tutor debe definir un precio por hora");
  }

  const correo = normalizarEmail(email);
  if (await usuarios.existeEmail(correo)) throw ApiError.conflict("El correo ya está registrado");

  const id = await usuarios.crear({
    ...datos,
    nombre: nombre.trim(),
    email: correo,
    password_hash: await bcrypt.hash(password, 10),
    precio_hora: rol === "tutor" ? Number(precio_hora) : null,
  });

  const usuario = { id, nombre: nombre.trim(), email: correo, rol };
  return { usuario, token: firmarToken(usuario) };
}

async function iniciarSesion(email, password) {
  if (!esEmailValido(email) || !password) throw ApiError.badRequest("Credenciales incompletas");

  const usuario = await usuarios.buscarPorEmail(normalizarEmail(email));
  if (!usuario) throw ApiError.unauthorized("Credenciales incorrectas");
  if (!usuario.activo) throw ApiError.forbidden("Cuenta desactivada");

  const valido = await bcrypt.compare(password, usuario.password_hash);
  if (!valido) throw ApiError.unauthorized("Credenciales incorrectas");

  delete usuario.password_hash;
  return { usuario, token: firmarToken(usuario) };
}

async function perfil(id) {
  const usuario = await usuarios.perfilPorId(id);
  if (!usuario) throw ApiError.notFound("Usuario no encontrado");
  return usuario;
}

module.exports = { registrar, iniciarSesion, perfil, firmarToken, verificarToken };

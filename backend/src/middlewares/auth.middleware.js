/** RNF-01: rutas protegidas por token y por rol. */
const { verificarToken } = require("../services/auth.service");

function requiereAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    req.usuario = verificarToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No autorizado para esta acción" });
    }
    return next();
  };
}

module.exports = { requiereAuth, requiereRol };

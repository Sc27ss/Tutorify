/**
 * Configuración central de la aplicación (variables de entorno).
 */
module.exports = {
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || "cambia-esta-clave-en-produccion",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  MEET_BASE_URL: process.env.MEET_BASE_URL || "https://meet.google.com",
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "tutoraula",
  },
};

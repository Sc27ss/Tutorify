/**
 * Punto de arranque del backend de Tutorify.
 * Ejecutar:  node backend/server.js
 */
const app = require("./src/app");
const { PORT } = require("./src/config/env");

app.listen(PORT, () => {
  console.log(`Tutorify API escuchando en http://localhost:${PORT}`);
});

module.exports = app;

/**
 * Tutorify - Configuración de la aplicación Express (sin arrancar el servidor).
 * Capas: routes -> controllers -> services -> repositories -> database.
 */
const express = require("express");
const cors = require("cors");
const path = require("path");

const rutas = require("./routes");
const { noEncontrado, manejadorErrores } = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "..", "public", "legacy")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", rutas);

app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;

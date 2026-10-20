/** Enrutador raíz de la API: agrupa todos los módulos bajo /api. */
const { Router } = require("express");

const router = Router();

router.use("/auth", require("./auth.routes"));
router.use("/materias", require("./materias.routes"));
router.use("/tutores", require("./tutores.routes"));
router.use("/disponibilidad", require("./disponibilidad.routes"));
router.use("/tutorias", require("./tutorias.routes"));
router.use("/pagos", require("./pagos.routes"));
router.use("/resenas", require("./resenas.routes"));

module.exports = router;

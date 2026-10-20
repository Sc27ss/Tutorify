const { Router } = require("express");
const ctrl = require("../controllers/disponibilidad.controller");
const asyncHandler = require("../utils/asyncHandler");
const { requiereAuth, requiereRol } = require("../middlewares/auth.middleware");

const router = Router();
router.post("/", requiereAuth, requiereRol("tutor"), asyncHandler(ctrl.crear));

module.exports = router;

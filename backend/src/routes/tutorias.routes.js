const { Router } = require("express");
const ctrl = require("../controllers/tutorias.controller");
const asyncHandler = require("../utils/asyncHandler");
const { requiereAuth, requiereRol } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/", requiereAuth, requiereRol("estudiante"), asyncHandler(ctrl.crear));
router.get("/mias", requiereAuth, asyncHandler(ctrl.mias));

module.exports = router;

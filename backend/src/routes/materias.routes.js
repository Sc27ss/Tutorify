const { Router } = require("express");
const ctrl = require("../controllers/materias.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = Router();
router.get("/", asyncHandler(ctrl.listar));

module.exports = router;

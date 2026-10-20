const { Router } = require("express");
const ctrl = require("../controllers/tutores.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = Router();

router.get("/", asyncHandler(ctrl.buscar));
router.get("/:id/disponibilidad", asyncHandler(ctrl.disponibilidad));
router.get("/:id/resenas", asyncHandler(ctrl.resenas));

module.exports = router;

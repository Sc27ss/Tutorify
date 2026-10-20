const { Router } = require("express");
const ctrl = require("../controllers/resenas.controller");
const asyncHandler = require("../utils/asyncHandler");
const { requiereAuth, requiereRol } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/destacadas", asyncHandler(ctrl.destacadas));
router.post("/", requiereAuth, requiereRol("estudiante"), asyncHandler(ctrl.crear));

module.exports = router;

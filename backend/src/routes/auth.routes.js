const { Router } = require("express");
const ctrl = require("../controllers/auth.controller");
const asyncHandler = require("../utils/asyncHandler");
const { requiereAuth } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/registro", asyncHandler(ctrl.registro));
router.post("/login", asyncHandler(ctrl.login));
router.get("/perfil", requiereAuth, asyncHandler(ctrl.perfil));

module.exports = router;

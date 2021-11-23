const { Router } = require("express");
const {
	signUp,
	signIn,
	emailValidation,
	modificarGrau,
	modificarPassword,
} = require("./controllers/userController");
const { headersController, validateJWT } = require("./middleware/middleware");

const router = Router();
//Middleware
router.use("*", headersController);
router.use("*", validateJWT);

//User
router.post("/user/signUp", signUp);
router.post("/user/signIn", signIn);
router.get("/user/emailVerification/:id/:token/:student", emailValidation);
router.post("/user/modificarGrau", modificarGrau);
router.post("/user/modificarContrasenya", modificarPassword);

export default router;

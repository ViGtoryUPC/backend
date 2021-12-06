const { Router } = require("express");
const {
	signUp,
	signIn,
	emailValidation,
	modificarGrau,
	modificarPassword,
	getInfoUsuari,
	afegirSegonCorreu,
	modificarCorreu,
} = require("./controllers/userController");
const { getAllGraus } = require("./controllers/grauController");
const { getAssignatures } = require("./controllers/assignaturaController");
const { headersController, validateJWT } = require("./middleware/middleware");

const router = Router();
//Middleware
router.use("*", headersController);
router.use("*", validateJWT);

//User
router.post("/user/signUp", signUp);
router.post("/user/signIn", signIn);
router.get(
	"/user/emailVerification/:id/:token/:student/:modified",
	emailValidation
);
router.post("/user/modificarGrau", modificarGrau);
router.post("/user/modificarContrasenya", modificarPassword);
router.get("/user/getInfoUsuari", getInfoUsuari);
router.post("/user/afegirSegonCorreu", afegirSegonCorreu);
router.post("/user/modificarCorreu", modificarCorreu);

//Grau
router.get("/grau/getAllGraus", getAllGraus);

//Assignatura
router.get("/assignatura/getAssignatures", getAssignatures);

export default router;

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
const {
	getAssignatures,
	voteAssignatura,
	getVotesAssignatura,
} = require("./controllers/assignaturaController");
const {
	newAportacio,
	getAllAportacionsForAssignatura,
	getAportacio,
	voteAportacio,
	deleteAportacio,
	addFile,
	getFileNamesAportacio,
	downloadFile,
	downloadAllFiles,
	getAllAportacionsForUser,
	deleteAllAportacionsForUser,
} = require("./controllers/aportacioController");
const {
	newComentari,
	getComentaris,
	voteComentari,
	deleteComentari,
} = require("./controllers/comentariController");

const { headersController, validateJWT } = require("./middleware/middleware");
import upload from "./middleware/multer";

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
router.post("/assignatura/voteAssignatura", voteAssignatura);
router.get("/assignatura/getVotesAssignatura", getVotesAssignatura);

//Aportacio
router.post("/aportacio/newAportacio", newAportacio);
router.get(
	"/aportacio/getAllAportacionsForAssignatura",
	getAllAportacionsForAssignatura
);
router.get("/aportacio/getAportacio", getAportacio);
router.post("/aportacio/voteAportacio", voteAportacio);
router.post("/aportacio/deleteAportacio", deleteAportacio);
router.post("/aportacio/addFile", upload.single("file"), addFile);
router.get("/aportacio/getFileNamesAportacio", getFileNamesAportacio);
router.get("/aportacio/downloadFile", downloadFile);
router.get("/aportacio/downloadAllFiles", downloadAllFiles);
router.get("/aportacio/getAllAportacionsForUser", getAllAportacionsForUser);
router.post(
	"/aportacio/deleteAllAportacionsForUser",
	deleteAllAportacionsForUser
);

//Comentari
router.post("/comentari/newComentari", newComentari);
router.get("/comentari/getComentaris", getComentaris);
router.post("/comentari/voteComentari", voteComentari);
router.post("/comentari/deleteComentari", deleteComentari);

export default router;

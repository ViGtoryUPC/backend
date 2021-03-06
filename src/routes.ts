var cors = require("cors");
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
	getAportacions,
	getAportacio,
	voteAportacio,
	deleteAportacio,
	addFile,
	deleteFile,
	editAportacio,
	downloadFile,
	downloadAllFiles,
	deleteAllAportacionsForUser,
} = require("./controllers/aportacioController");
const {
	newComentari,
	getComentaris,
	voteComentari,
	deleteComentari,
	editComentari,
} = require("./controllers/comentariController");
const { getHorarisAssignatures } = require("./controllers/horariController");

const { headersController, validateJWT } = require("./middleware/middleware");
import upload from "./middleware/multer";

const router = Router();
//Middleware
router.options("*", cors());
router.use("*", headersController);
router.use("*", validateJWT);

//User
router.post("/user/signUp", signUp);
router.post("/user/signIn", signIn);
router.get(
	"/user/emailVerification/:id/:token/:student/:modified",
	emailValidation
);
router.put("/user/modificarGrau", modificarGrau);
router.put("/user/modificarContrasenya", modificarPassword);
router.get("/user/getInfoUsuari", getInfoUsuari);
router.post("/user/afegirSegonCorreu", afegirSegonCorreu);
router.put("/user/modificarCorreu", modificarCorreu);

//Grau
router.get("/grau/getAllGraus", getAllGraus);

//Assignatura
router.get("/assignatura/getAssignatures", getAssignatures);
router.put("/assignatura/voteAssignatura", voteAssignatura);
router.get("/assignatura/getVotesAssignatura", getVotesAssignatura);

//Aportacio
router.post("/aportacio/newAportacio", newAportacio);
router.get("/aportacio/getAportacions", getAportacions);
router.get("/aportacio/getAportacio", getAportacio);
router.put("/aportacio/voteAportacio", voteAportacio);
router.delete("/aportacio/deleteAportacio", deleteAportacio);
router.put("/aportacio/editAportacio", editAportacio);
router.delete("/aportacio/deleteFile", deleteFile);
router.post("/aportacio/addFile", upload.single("file"), addFile);
router.get("/aportacio/downloadFile", downloadFile);
router.get("/aportacio/downloadAllFiles", downloadAllFiles);
router.delete(
	"/aportacio/deleteAllAportacionsForUser",
	deleteAllAportacionsForUser
);

//Comentari
router.post("/comentari/newComentari", newComentari);
router.get("/comentari/getComentaris", getComentaris);
router.put("/comentari/voteComentari", voteComentari);
router.delete("/comentari/deleteComentari", deleteComentari);
router.put("/comentari/editComentari", editComentari);

//Horari
router.get("/horari/getHorarisAssignatures", getHorarisAssignatures);

export default router;

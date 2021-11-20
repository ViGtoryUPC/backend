const { Router } = require("express");
const {
	signUp,
	signIn,
	emailValidation,
} = require("./controllers/userController");
const { headersController } = require("./middleware/middleware");

const router = Router();
//Middleware
router.use("*", headersController);

//User
router.post("/user/signUp", signUp);
router.post("/user/signIn", signIn);
router.get("/user/emailVerification/:id/:token", emailValidation);

export default router;

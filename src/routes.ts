const { Router } = require("express");
const { signUp, signIn } = require("./controllers/userController");
const { headersController } = require("./middleware/middleware");

const router = Router();
router.use("*", headersController);

router.post("/user/signUp", signUp);
router.post("/user/signIn", signIn);

export default router;

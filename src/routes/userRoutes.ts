const { Router } = require("express");
const { signUp, signIn } = require("../controllers/userController");

const router = Router();

router.post("/user/signUp", signUp);
router.post("/user/signIn", signIn);

module.exports = router;

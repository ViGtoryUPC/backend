const { Router } = require("express");
const { signUp } = require("../controllers/userController");

const router = Router();

router.post("/user/signUp", signUp);

module.exports = router;

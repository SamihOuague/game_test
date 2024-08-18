const router = require("express").Router();
const { register, login, ping } = require("./Controller");
const { getPKCEToken, verifyPKCEToken } = require("./utils/pkce");

router.get("/ping", ping);
router.get("/get-pkce", getPKCEToken);
router.post("/register", verifyPKCEToken, register);
router.post("/login", verifyPKCEToken, login);

module.exports = router;
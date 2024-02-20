const express = require("express");
const router = express.Router();
const userController = require("../controller/usersController");
const bodyParser = require("body-parser");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));



// home page render
router.get("/", userController.homePage);
router.get("/login", userController.loginGetPage);
router.get("/signup", userController.signupGetPage);
router.get("/userProfile",userController.userProfile)

router.post("/user/signup", userController.signupPostPage);
router.post("/user/login",userController.loginPostPage)

module.exports = router;

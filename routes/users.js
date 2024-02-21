const express = require("express");
const router = express.Router();
const userController = require("../controller/usersController");
const passport = require("passport")
require("../passport")
require("dotenv").config()
const bodyParser = require("body-parser");

router.use(passport.initialize())
router.use(passport.session())
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Initialize session in controller
router.use(userController.initializeSession);

// ROUTER
router.get("/", userController.homePage);
router.get("/login", userController.loginGetPage);
router.get("/signup", userController.signupGetPage);
router.get("/userProfile", userController.userProfile);
router.get("/user/logout",userController.userLogout)
router.get("/",userController.loadAuth)

router.post("/user/signup", userController.signupPostPage);
router.post("/user/login", userController.loginPostPage);


//Auth 
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

//Auth callback 
router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/success',
      failureRedirect: '/failure',
    })
  );

//successs
router.get('/success', userController.successGoogleLogin);

//failuer
router.get('/failure', userController.failureGooglelogin);

module.exports = router;



const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { adminAuthMiddleware }  = require("../middleware/jwtMiddleware");
const bodyParser = require("body-parser");

// body parser middleware
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


// ROUTER
router.get("/adminLogin", adminController.loginGetPage);
router.get("/admin/dashboard",adminAuthMiddleware,adminController.dashboardPage)
router.get("/admin/logout",adminController.adminLogout)
router.get("/customersList",adminAuthMiddleware,adminController.customersList)



router.post("/admin/login", adminController.loginPostPage);


module.exports = router;

const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { ensureAuthenticated } = require("../middleware/auth");
const bodyParser = require("body-parser");

// body parser middleware
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Initialize session in controller
router.use(adminController.initializeSession);

// ROUTER
router.get("/admin", adminController.loginGetPage);
router.get("/admin/logout", adminController.adminLogout);
router.get("/admin/index", ensureAuthenticated, adminController.dashboardPage);

router.post("/admin/login", adminController.loginPostPage);

module.exports = router;

const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { ensureAuthenticated } = require("../middleware/jwtMiddleware");
const bodyParser = require("body-parser");

// body parser middleware
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// ROUTER
router.get("/admin", adminController.loginGetPage);
router.get("/admin/logout", adminController.adminLogout);


router.post("/admin/login", adminController.loginPostPage);

module.exports = router;

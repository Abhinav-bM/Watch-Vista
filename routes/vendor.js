const express = require("express");
const router = express.Router();
const vendorController = require("../controller/vendorController");
const { ensureAuthenticated } = require("../middleware/auth");
const bodyParser = require("body-parser");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Initialize session in controller
router.use(vendorController.initializeSession);

router.get("/vendor", vendorController.loginGetPage);
router.get("/vendor/register",vendorController.registerGetPage)

router.post("/vendor/register",vendorController.vendorRegisterPostPage)
router.post("/vendor/login",vendorController.vendorLoginPostPage)

module.exports = router;
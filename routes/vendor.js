const express = require("express");
const router = express.Router();
const vendorController = require("../controller/vendorController");
const { vendorAuthMiddleware } = require("../middleware/jwtMiddleware");
const multer = require('multer');
const bodyParser = require("body-parser");

const upload = multer({ dest: 'uploads/' });


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/vendor/dashboard",vendorAuthMiddleware,vendorController.dashboard)
router.get("/vendor/login", vendorController.loginGetPage);
router.get("/vendor/register",vendorController.registerGetPage)
router.get("/vendor/logout",vendorController.vendorLogout)
router.get("/vendor/addProduct",vendorAuthMiddleware,vendorController.addProduct)

router.post("/vendor/register",vendorController.vendorRegisterPostPage)
router.post("/vendor/login",vendorController.vendorLoginPostPage)
router.post("/vendor/addProduct",vendorAuthMiddleware,upload.array('productImages',4),vendorController.addProductpost)


module.exports = router;    
const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const bodyParser = require("body-parser");



router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


// Initialize session in controller
router.use(adminController.initializeSession);

// ROUTER
router.get('/admin',adminController.loginGetPage)

router.post('/admin/login',adminController.loginPostPage)

module.exports = router
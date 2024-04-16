const express = require("express");
const router = express.Router();
const vendorController = require("../controller/vendorController");
const { vendorAuthMiddleware } = require("../middleware/jwtMiddleware");
const upload = require("../config/multer")
const bodyParser = require("body-parser");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/vendor/dashboard",vendorAuthMiddleware,vendorController.dashboard)
router.get("/vendor/login", vendorController.loginGetPage);
router.get("/venodor/forgotPassword",vendorController.forgotEmail)
router.get("/vendor/register",vendorController.registerGetPage)
router.get("/vendor/logout",vendorController.vendorLogout)
router.get("/vendor/addProduct",vendorAuthMiddleware,vendorController.addProduct)
router.get("/vendor/productList",vendorAuthMiddleware,vendorController.producList)
router.get("/vendor/editProduct/:id",vendorAuthMiddleware,vendorController.editProduct)
router.get("/vendor/orders",vendorAuthMiddleware,vendorController.getOrdersForVendor)
router.get("/vendorProfile",vendorAuthMiddleware,vendorController.vendorProfile)
router.get("/vendor/sales-report/excel/:startDate/:endDate",vendorAuthMiddleware,vendorController.salesExcel)


router.post("/vendor/register",vendorController.vendorRegisterPostPage) 
router.post("/vendor/login",vendorController.vendorLoginPostPage)
router.post("/vendor/forgotEmail",vendorController.forgotPassEmailPost)
router.post("/vendor/forgotOtpPost",vendorController.forgotOrpVerify)
router.post("/vendor/addProduct",vendorAuthMiddleware,upload.array('productImages',4),vendorController.addProductpost)
router.post("/vendor/editProduct/:id",vendorAuthMiddleware,upload.array('productImages',4),vendorController.editProductPost)
router.post("/vendor/deleteProduct/:id",vendorAuthMiddleware,vendorController.deleteProduct)
router.post("/vendor/updateOrderStatus/:orderId/:productId",vendorAuthMiddleware,vendorController.updateOrderStatus)



module.exports = router;    
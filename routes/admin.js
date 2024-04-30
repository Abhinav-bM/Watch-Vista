const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { adminAuthMiddleware }  = require("../middleware/jwtMiddleware");
const bodyParser = require("body-parser");
const adminModel = require("../models/adminModel");
const upload = require("../config/multer")


// body parser middleware
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


// ROUTER
router.get("/login", adminController.loginGetPage);
router.get("/dashboard",adminAuthMiddleware,adminController.dashboardPage)
router.get("/logout",adminController.adminLogout)
router.get("/customersList",adminAuthMiddleware,adminController.customersList)
router.get("/categoryList",adminAuthMiddleware,adminController.categoryList)
router.get("/subcategoryList",adminAuthMiddleware,adminController.subcategoryList)
router.get("/productList",adminAuthMiddleware,adminController.productList)
router.get("/vendorsList",adminAuthMiddleware,adminController.vendorsList)
router.get("/couponList",adminAuthMiddleware,adminController.couponList)
router.get("/couponAddGet",adminAuthMiddleware,adminController.couponAddGet)
router.get("/editCouponGet/:id",adminAuthMiddleware,adminController.editCouponGet)
router.get("/banner",adminAuthMiddleware,adminController.bannerGetPage)
router.get("/orders",adminAuthMiddleware,adminController.ordersList)

router.post("/loginPost", adminController.loginPostPage);
router.post("/addCategory",adminAuthMiddleware,adminController.addCategory)
router.post("/updateCategory",adminAuthMiddleware,adminController.updateCategory)
router.post("/deleteCategory",adminAuthMiddleware,adminController.deleteCategory)
router.post("/addSubcategory",adminAuthMiddleware,adminController.addSubcategory)
router.post("/updateSubcategory",adminAuthMiddleware,adminController.updateSubcategory)
router.post("/deleteSubcategory",adminAuthMiddleware,adminController.deleteSubcategory)
router.post('/blockUser',adminController.blockUser);
router.post("/vendorVerify",adminController.verifyVendor)
router.post("/couponAddPost",adminAuthMiddleware,adminController.couponAddPost)
router.post("/bannerAdd",adminAuthMiddleware,upload.array('bannerImage'),adminController.bannerAddPost)

router.put("/editCouponPost",adminAuthMiddleware, adminController.editCouponPost)

router.delete("/deleteCoupon/:id",adminAuthMiddleware,adminController.deleteCoupon)
router.delete("/bannerDelete/:bannerId",adminAuthMiddleware,adminController.deleteBanner)


module.exports = router;

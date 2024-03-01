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
router.get("/admin/customersList",adminAuthMiddleware,adminController.customersList)
router.get("/admin/categoryList",adminAuthMiddleware,adminController.categoryList)
router.get("/admin/subcategoryList",adminAuthMiddleware,adminController.subcategoryList)


router.post("/admin/login", adminController.loginPostPage);
router.post('/blockUser',adminController.blockUser);

router.post("/admin/addCategory",adminAuthMiddleware,adminController.addCategory)
router.post("/admin/updateCategory",adminAuthMiddleware,adminController.updateCategory)
router.post("/admin/deleteCategory",adminAuthMiddleware,adminController.deleteCategory)

router.post("/admin/addSubcategory",adminAuthMiddleware,adminController.addSubcategory)
router.post("/admin/updateSubcategory",adminAuthMiddleware,adminController.updateSubcategory)
router.post("/admin/deleteSubcategory",adminAuthMiddleware,adminController.deleteSubcategory)

module.exports = router;

const express = require("express");
const router = express.Router();
const userController = require("../controller/usersController");
const passport = require("../helpers/passport");
require("dotenv").config();
const bodyParser = require("body-parser");
const {verifyToken} = require('../middleware/jwtMiddleware');

router.use(passport.initialize());
router.use(passport.session());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// ROUTER
router.get("/", userController.homePage);
router.get("/login",verifyToken, userController.loginGetPage);
router.get("/signup", userController.signupGetPage);
router.get("/userProfile", verifyToken, userController.userProfile);
router.get("/user/logout", userController.userLogout);
router.get("/", userController.loadAuth);
router.get("/forgotPassword", userController.forgotGetPage);
router.get("/loginOtp", userController.loginWithOtpGetPage);
router.get("/shop", userController.shopGetPage);
router.get("/products", userController.singleProductGetPage);
router.get("/cart",verifyToken,userController.getCart)
router.get("/checkout",verifyToken,userController.checkoutpage)
router.get("/products/:category",userController.getProductsByCategory)
router.get("/buyNow/checkout/:productId",verifyToken,userController.buyNowCheckOut)
 
router.post("/user/send-otp", userController.signupPostPage);
router.post('/verify-otp', userController.signupVerify)
router.post("/user/login", userController.loginPostPage);
router.post("/forgotPassword", userController.forgotEmailPostPage);
router.post("/resetPassword", userController.resetPassword);
router.post("/loginOtp", userController.loginRequestOTP);
router.post("/loginOtpDone", userController.loginVerifyOTP);
router.post("/cart/add-to-cart",verifyToken,userController.addToCart)
router.post("/cart/update-quantity",verifyToken,userController.updateCartQuantity)
router.post("/add-address",verifyToken,userController.addAddress)
router.post("/place-order",verifyToken,userController.placeOrderPost)
router.post("/cancelOrder/:orderId/:productId",verifyToken,userController.orderCancelRequestPost)
router.post("/change-password",verifyToken,userController.changePasswordPost)

router.put("/update-address/:id",verifyToken,userController.editAddress)

router.delete("/cart/:productId",verifyToken,userController.removeProductCart)
router.delete("/delete-address/:addressId",verifyToken,userController.deleteAddress)


// LOGIN WITH GOOGLE STARTS HERE
//Auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
//Auth callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/success",
    failureRedirect: "/failure",
  })
);
router.get("/success", userController.successGoogleLogin);
router.get("/failure", userController.failureGooglelogin);
// LOGIN WITH GOOGLE ENDS HERE

module.exports = router;
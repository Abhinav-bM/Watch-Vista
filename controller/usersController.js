const User = require("../models/usersModel");
const Vendor = require("../models/vendorsModel");
const Admin = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const smsService = require("../helpers/smsService");
const { sendOtpEmail } = require("../helpers/emailService");
const { name } = require("ejs");
const mongoose = require("mongoose");
const { log } = require("firebase-functions/logger");
const Razorpay = require("razorpay");
const { findUserOrders } = require("../helpers/userHelper");
require("dotenv").config();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// HOME PAGE DISPLAY
let homePage = async (req, res) => {
  const token = req.cookies.jwt;

  try {
    let products = await Vendor.find().select("products");
    const admin = await Admin.findOne();
    const bannerHome = admin.banner.filter(
      (banner) => banner.placement === "Home Page"
    );

    let user;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      const userId = decoded.id;
      user = await User.findById(userId);
    }

    res
      .status(200)
      .render("user/home", { products: products, bannerHome, user });
  } catch (error) {
    console.error("Failed to get home:", error);
    res.status(500).send("Internal Server Error");
  }
};

// AUTH
const loadAuth = (req, res) => [res.render("auth")];

// USER SIGNUP PAGE DISPLAY
let signupGetPage = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    console.error("Failed to get login page:", error);
    res.status(500).send("Internal Server Error");
  }
};

// USER SIGNUP
let signupPostPage = async (req, res) => {
  try {
    const { userName, email, phoneNumber, password } = req.body;
    let phone = phoneNumber;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!phone.startsWith("+91")) {
      phone = "+91" + phone;
    }

    // Generate a random 4-digit OTPs
    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();

    // Send OTP via Email
    const emailMessage = `your otp for verification is ${emailOtp}`;
    sendOtpEmail(email, emailMessage);

    // send OTP via phone
    smsService.sendOTP(phone, phoneOtp);

    console.log("otps send successfully");
    // Save the OTPs to the session for verification
    req.session.phoneOtp = phoneOtp;
    req.session.emailOtp = emailOtp;

    return res.status(200).json({ message: "OTP sent to phone and email." });
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
};

let signupVerify = async (req, res) => {
  try {
    const { userName, email, phoneNumber, password, phoneOtp, emailOtp } =
      req.body;
    const sessionPhoneOtp = req.session.phoneOtp;
    const sessionEmailOtp = req.session.emailOtp;

    if (phoneOtp === sessionPhoneOtp && emailOtp === sessionEmailOtp) {
      // If both OTPs are valid, create and save the new user
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name: userName,
        email,
        phoneNumber,
        password: hashedPassword,
      });

      await newUser.save();

      const user = await User.findOne({ email });

      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        process.env.JWT_KEY,
        {
          expiresIn: "24h",
        }
      );

      res.cookie("jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry

      console.log("New user created:", newUser);
      return res
        .status(200)
        .json({ success: true, message: "User created successfully" });
    } else {
      res.status(400).json({ error: "Invalid OTPs. Please try again." });
    }
  } catch (error) {
    console.error("Verification failed:", error);
    res
      .status(500)
      .json({ error: "Verification failed. Please try again later." });
  }
};
// USER SIGNUP ENDS HERE

// USER LOGIN PAGE DISPLAY
let loginGetPage = async (req, res) => {
  try {
    if (req.cookies.jwt) {
      return res.redirect("/");
    }

    res.render("user/login", { error: " " });
  } catch (error) {
    console.error("Failed to get login page:", error);
    res.status(500).send("Internal Server Error");
  }
};

// USER LOGIN
let loginPostPage = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    if (user.blocked) {
      return res.status(403).json({ error: "You are restricted by admin" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "24h",
      }
    );

    res.cookie("jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry

    res.status(200).json({ message: "Login successful", token });
    console.log("user logged in with email and password : jwt created");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// LOGIN WITH GOOGLE
const successGoogleLogin = async (req, res) => {
  try {
    if (!req.user) {
      // If no user data
      return res.status(401).send("no user data , login failed");
    }

    // Checking user already exists in database
    let user = await User.findOne({ email: req.user.email });

    if (user.blocked) {
      return res.render("user/login", { error: "You are restricted by admin" });
    }

    if (!user) {
      // If the user does not exist, create a new user
      user = new User({
        name: req.user.displayName,
        email: req.user.email,
      });

      // Save the new user to the database
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "24h",
      }
    );

    // Set JWT token in a cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      secure: process.env.NODE_ENV === "production", // Set to true in production for HTTPS
    });

    // Redirect the user to the home page
    res.status(200).redirect("/");

    console.log("User logged in with Google : jwt created");
  } catch (error) {
    console.error("Error logging in with Google:", error);
    res.status(500).redirect("/login");
  }
};

const failureGooglelogin = (req, res) => {
  res.status(500).send("Error logging in with Google");
};

// LOGIN WITH OTP STARTS HERE
// LOGIN WITH OTP PAGE DISPLAY
let loginWithOtpGetPage = async (req, res) => {
  try {
    res.render("user/loginOtpPhone");
  } catch (error) {
    res.status(404).send("page not found");
  }
};

// REQUEST FOR OTP AFTER ENTERED PHONE
const loginRequestOTP = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    let phone = phoneNumber;

    if (!phone.startsWith("+91")) {
      phone = "+91" + phone;
    }

    const user = await User.findOne({ phoneNumber: phone });

    if (!user) {
      return res
        .status(404)
        .render("user/loginOtpPhone", { error: "User not found" });
    }

    if (user.blocked) {
      return res.status(403).render("user/loginOtpPhone", {
        error: "Your are restricted by admin",
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
    await user.save();

    smsService.sendOTP(phoneNumber, otp);

    res.status(200).render("user/loginOtp", { phone });
    console.log("OTP SMS sent");
  } catch (error) {
    console.error("Error requesting OTP:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const loginVerifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const user = await User.findOne({ phoneNumber });
    let phone = phoneNumber;
    if (user.otp !== otp || Date.now() > user.otpExpiration) {
      return res
        .status(400)
        .render("user/loginOtp", { error: "Invalid or expired OTP", phone });
    }

    // Clear OTP fields after successful verification
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "24h",
      }
    );

    res.cookie("jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hours expiry

    res.status(200).redirect("/");
    console.log("User logged in using OTP : JWT created");
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
// LOGIN WITH OTP ENDS HERE

// FORGOT PASSWORD -- STARTS FROM HERE
// FORGOT PASSWORD PAGE DISPLAY
let forgotGetPage = async (req, res) => {
  try {
    res.render("user/forgotemail");
  } catch (error) {
    res.status(404).send("page not found");
  }
};

// FORGOT EMAIL POST + OTP GENERATION AND MAIL SEND
let forgotEmailPostPage = async (req, res) => {
  const { emailOrPhone } = req.body;

  try {
    let user;
    let message;
    const otp = generateOTP();
    // Check if input is an email or phone number
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
      //find user by email
      user = await User.findOne({ email: emailOrPhone });
      if (!user) {
        return res
          .status(404)
          .render("user/forgotemail", { error: "User not found" });
      }
      message = `Your OTP to reset your password is: ${otp}`;
      await sendOtpEmail(emailOrPhone, message);
    } else if (/^(\+91)?\d{10}$/.test(emailOrPhone)) {
      let phone = emailOrPhone;

      if (!phone.startsWith("+91")) {
        phone = "+91" + phone;
      }
      // find user by phone
      user = await User.findOne({ phoneNumber: phone });
      if (!user) {
        return res
          .status(404)
          .render("user/forgotemail", { error: "User not found" });
      }
      smsService.sendOTP(emailOrPhone, otp);
    } else {
      return res.status(400).json({ message: "Invalid email or phone number" });
    }

    // Update user with OTP and expiration time
    user.otp = otp;
    user.otpExpiration = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
    await user.save();

    res.render("user/forgototp", { emailOrPhone });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// RESET PASSWORD
let resetPassword = async (req, res) => {
  const { emailOrPhone, otp, newPassword, confirmPassword } = req.body;

  try {
    let user;

    // Check if emailOrPhone is an email or phone number
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
      user = await User.findOne({ email: emailOrPhone });
    } else if (/^(\+91)?\d{10}$/.test(emailOrPhone)) {
      let phone = emailOrPhone;
      if (!phone.startsWith("+91")) {
        phone = "+91" + emailOrPhone;
      }
      user = await User.findOne({ phoneNumber: phone });
    } else {
      return res.status(400).render("user/forgototp", {
        error: "Invalid Email or Phone format",
        emailOrPhone: emailOrPhone,
      });
    }

    if (!user) {
      return res.status(404).render("user/forgototp", {
        error: "User not found",
        emailOrPhone: emailOrPhone,
      });
    }

    // Check OTP and its expiration
    if (user.otp !== otp || Date.now() > user.otpExpiration) {
      return res.status(400).render("user/forgototp", {
        error: "Invalid or expired OTP",
        emailOrPhone: emailOrPhone,
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).render("user/forgototp", {
        error: "Passwords do NOT match",
        emailOrPhone: emailOrPhone,
      });
    }

    // Hash the new password
    const bcryptedNewPassword = await bcrypt.hash(newPassword, 10);

    // Reset password and clear OTP fields
    user.password = bcryptedNewPassword;
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    console.log("Password reset successful");

    res.status(200).redirect("/login");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
// FORGOT PASSWORD -- ENDS HERE

// LOGOUT STARTS HERE
let userLogout = async (req, res) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/login"); // If no token, redirect to login
  }

  try {
    // Clear the JWT cookie
    res.clearCookie("jwt");

    res.redirect("/login");
    console.log("User logged out");
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
  }
};
// LOGOUT ENDS HERE

// SHOP PAGE DISPLAY
let shopGetPage = async (req, res) => {
  const token = req.cookies.jwt;
  try {
    let products = await Vendor.find().select("products");

    const admin = await Admin.findOne({}); // Assuming there's only one admin for simplicity
    const allCategories = [];

    admin.categories.forEach((category) => {
      allCategories.push(category.categoryName);
    });

    let user;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      const userId = decoded.id;
      user = await User.findById(userId);
    }

    res.status(200).render("user/shop", { products, allCategories, user });
  } catch (error) {
    console.log("page not found :", error);
    res.status(404).send("page not found");
  }
};

// PRDUCTS BASED ON CATEGORY
let getProductsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    let vendorProducts = await Vendor.find().select("products");

    let allProducts = vendorProducts.map((vendor) => vendor.products).flat();

    let filteredProducts = allProducts.filter(
      (product) => product.productCategory === category
    );

    console.log(filteredProducts);

    res.status(200).json({ message: "product filtered", filteredProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET PRODUCTS BY SORT
let getProductBySort = async (req, res) => {
  const { option } = req.params;
  try {
    let vendorProducts = await Vendor.find().select("products");

    let allProducts = vendorProducts.map((vendor) => vendor.products).flat();

    switch (option) {
      case "latest":
        allProducts.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "low to high":
        allProducts.sort((a, b) => a.productPrice - b.productPrice);
        break;
      case "high to low":
        allProducts.sort((a, b) => b.productPrice - a.productPrice);
        break;
      default:
        // Default sorting
        break;
    }

    res.status(200).json({ message: "product filtered", allProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET PRODUCTS BY SEARCH
let getSearchProduct = async (req, res) => {
  const searchTerm = req.params.inputValue;
  try {
    const vendorProducts = await Vendor.find().select("products");

    const allProducts = vendorProducts.map((vendor) => vendor.products).flat();

    const filteredProducts = allProducts.filter(
      (product) =>
        product.productBrand
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase()) ||
        product.productName
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase())
    );

    res.status(200).json({ message: "product filtered", filteredProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DISPLAY SINGLE PRODUCT PAGE
let singleProductGetPage = async (req, res) => {
  const token = req.cookies.jwt;
  try {
    const productId = req.query.productId;

    const vendor = await Vendor.findOne({ "products._id": productId });

    if (!vendor) {
      throw new Error("Product not found");
    }

    const products = vendor.products.find(
      (prod) => prod._id.toString() === productId
    );

    if (!products) {
      throw new Error("Product not found");
    }

    let user;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      const userId = decoded.id;
      user = await User.findById(userId);
    }

    res.render("user/singleProduct", { products: products, user });
  } catch (error) {
    console.log("page not found :", error);
    res.status(404).send("page not found");
  }
};

// GET WISLIST PAGE
let getWishlist = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const allProducts = await Vendor.find({}).populate("products");
    let wishlistProducts = [];

    user.wishlist.products.forEach((cartProduct) => {
      const productId = cartProduct.productId;

      // Find the product in allProducts
      allProducts.forEach((vendor) => {
        vendor.products.forEach((product) => {
          if (product._id.equals(productId)) {
            const vendorInfo = {
              vendorId: vendor._id,
              vendorName: vendor.vendorName,
            };

            const productDetails = {
              _id: product._id,
              name: product.productName,
              category: product.productCategory,
              subcategory: product.productSubCategory,
              brand: product.productBrand,
              color: product.productColor,
              size: product.productSize,
              quantity: cartProduct.quantity,
              price: product.productPrice,
              mrp: product.productMRP,
              discount: product.productDiscount,
              images: product.productImages,
              description: product.productDescription,
              vendor: vendorInfo,
            };

            wishlistProducts.push(productDetails);
          }
        });
      });
    });

    res.render("user/wishlist", { wishlistProducts, user });
  } catch (error) {}
};

// ADD TO WIHSLIST
let addToWishlist = async (req, res) => {
  const productId = req.body.productId;
  const token = req.cookies.jwt;
  let userId;
  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      userId = decoded.id;
    }

    console.log(userId, productId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingProductIndex = user.wishlist.products.findIndex(
      (product) => product.productId.toString() === productId
    );

    if (existingProductIndex !== -1) {
      user.wishlist.products.splice(existingProductIndex, 1);

      await user.save();

      return res
        .status(200)
        .json({ message: "Product removed from wishlist successfully", user });
    } else {
      user.wishlist.products.push({ productId });

      await user.save();

      return res
        .status(201)
        .json({ message: "Product added to wishlist successfully", user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// REMOVE PRODUCT
let removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist.products = user.wishlist.products.filter(
      (item) => item.productId.toString() !== productId
    );

    await user.save();

    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ADD TO CART
let addToCart = async (req, res) => {
  const { productId } = req.body;
  const token = req.cookies.jwt;
  let userId;

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      userId = decoded.id;
    }
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingProductIndex = user.cart.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingProductIndex !== -1) {
      user.cart.products[existingProductIndex].quantity += 1;
    } else {
      user.cart.products.push({ productId, quantity: 1 });
    }

    await user.save();

    return res
      .status(200)
      .json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Unable to add product to cart" });
  }
};

// CART PAGE DISPLAY WITH PRODUCTS
let getCart = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const allProducts = await Vendor.find({}).populate("products");
    let cart = [];

    user.cart.products.forEach((cartProduct) => {
      const productId = cartProduct.productId;

      // Find the product in allProducts
      allProducts.forEach((vendor) => {
        vendor.products.forEach((product) => {
          if (product._id.equals(productId)) {
            const vendorInfo = {
              vendorId: vendor._id,
              vendorName: vendor.vendorName,
            };

            const productDetails = {
              _id: product._id,
              name: product.productName,
              category: product.productCategory,
              subcategory: product.productSubCategory,
              brand: product.productBrand,
              color: product.productColor,
              size: product.productSize,
              quantity: cartProduct.quantity,
              price: product.productPrice,
              mrp: product.productMRP,
              discount: product.productDiscount,
              images: product.productImages,
              description: product.productDescription,
              vendor: vendorInfo,
            };

            cart.push(productDetails);
          }
        });
      });
    });

    let subtotal = 0;
    let deliveryCharge = 0;
    cart.forEach((prod) => {
      subtotal += prod.quantity * prod.price;
    });
    return res
      .status(200)
      .render("user/cart", { cart, subtotal, deliveryCharge });
  } catch (error) {
    console.error("get Cart Error : ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// REMOVE PRODUCT FROM CART
let removeProductCart = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedCart = user.cart.products.filter(
      (product) => product.productId.toString() !== productId
    );

    user.cart.products = updatedCart;
    await user.save();

    ///////////////////////////////////
    const allProducts = await Vendor.find({}).populate("products");
    let cart = [];

    user.cart.products.forEach((cartProduct) => {
      const productId = cartProduct.productId;

      // Find the product in allProducts
      allProducts.forEach((vendor) => {
        vendor.products.forEach((product) => {
          if (product._id.equals(productId)) {
            const vendorInfo = {
              vendorId: vendor._id,
              vendorName: vendor.vendorName,
            };

            const productDetails = {
              _id: product._id,
              name: product.productName,
              category: product.productCategory,
              subcategory: product.productSubCategory,
              brand: product.productBrand,
              color: product.productColor,
              size: product.productSize,
              quantity: cartProduct.quantity,
              price: product.productPrice,
              mrp: product.productMRP,
              discount: product.productDiscount,
              images: product.productImages,
              description: product.productDescription,
              vendor: vendorInfo,
            };

            cart.push(productDetails);
          }
        });
      });
    });
    //////////////////////////////////////////////

    res
      .status(200)
      .json({ message: "Product removed from cart successfully", user, cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// UPDATE QUANTIY OF PRODUCT IN CART
let updateCartQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const productIndex = user.cart.products.findIndex(
      (product) => product.productId.toString() === productId
    );

    if (productIndex !== -1) {
      user.cart.products[productIndex].quantity = parseInt(quantity);

      await user.save();

      ///////////////////////////////////
      const allProducts = await Vendor.find({}).populate("products");
      let cart = [];

      user.cart.products.forEach((cartProduct) => {
        const productId = cartProduct.productId;

        // Find the product in allProducts
        allProducts.forEach((vendor) => {
          vendor.products.forEach((product) => {
            if (product._id.equals(productId)) {
              const vendorInfo = {
                vendorId: vendor._id,
                vendorName: vendor.vendorName,
              };

              const productDetails = {
                _id: product._id,
                name: product.productName,
                category: product.productCategory,
                subcategory: product.productSubCategory,
                brand: product.productBrand,
                color: product.productColor,
                size: product.productSize,
                quantity: cartProduct.quantity,
                price: product.productPrice,
                mrp: product.productMRP,
                discount: product.productDiscount,
                images: product.productImages,
                description: product.productDescription,
                vendor: vendorInfo,
              };

              cart.push(productDetails);
            }
          });
        });
      });
      //////////////////////////////////////////////

      res.status(200).json({
        message: "Quantity updated successfully",
        quantity,
        user,
        cart,
      });
    } else {
      res.status(404).json({ error: "Product not found in cart" });
    }
  } catch (error) {}
};

// PROCEED TO CHECKOUT PAGE DISPLAY
let checkoutpage = async (req, res) => {
  let userId = req.user.id;

  try {
    const user = await User.findById({ _id: userId });
    const addresses = user.addresses;

    ///////////////////////////////////
    const allProducts = await Vendor.find({}).populate("products");
    let cart = [];

    user.cart.products.forEach((cartProduct) => {
      const productId = cartProduct.productId;

      // Find the product in allProducts
      allProducts.forEach((vendor) => {
        vendor.products.forEach((product) => {
          if (product._id.equals(productId)) {
            const vendorInfo = {
              vendorId: vendor._id,
              vendorName: vendor.vendorName,
            };

            const productDetails = {
              _id: product._id,
              name: product.productName,
              category: product.productCategory,
              subcategory: product.productSubCategory,
              brand: product.productBrand,
              color: product.productColor,
              size: product.productSize,
              quantity: cartProduct.quantity,
              price: product.productPrice,
              mrp: product.productMRP,
              discount: product.productDiscount,
              images: product.productImages,
              description: product.productDescription,
              vendor: vendorInfo,
            };

            cart.push(productDetails);
          }
        });
      });
    });
    //////////////////////////////////////////////

    let totalPrice = 0;
    cart.forEach((prod) => (totalPrice += prod.price * prod.quantity));
    res.status(200).render("user/checkout", { addresses, cart, totalPrice });
  } catch (error) {
    console.error("Error on checkout page display :", error);
    res.status(500).json({ message: "An error occured" });
  }
};

// BUY NOW TO CHECKOUTPAGE
let buyNowCheckOut = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    const user = await User.findById({ _id: userId });
    const addresses = user.addresses;

    ///////////////////////////////////
    const allProducts = await Vendor.find({}).populate("products");
    let cart = [];

    // Find the product in allProducts
    allProducts.forEach((vendor) => {
      vendor.products.forEach((product) => {
        if (product._id.equals(productId)) {
          const vendorInfo = {
            vendorId: vendor._id,
            vendorName: vendor.vendorName,
          };
          const productDetails = {
            _id: product._id,
            name: product.productName,
            category: product.productCategory,
            subcategory: product.productSubCategory,
            brand: product.productBrand,
            color: product.productColor,
            size: product.productSize,
            quantity: 1,
            price: product.productPrice,
            mrp: product.productMRP,
            discount: product.productDiscount,
            images: product.productImages,
            description: product.productDescription,
            vendor: vendorInfo,
          };

          cart.push(productDetails);
        }
      });
    });

    //////////////////////////////////////////////
    let totalPrice = 0;
    cart.forEach((prod) => (totalPrice += prod.price * prod.quantity));

    res.status(200).render("user/checkout", { addresses, cart, totalPrice });
  } catch (error) {
    console.error("Error on checkout page display :", error);
    res.status(500).json({ message: "An error occured" });
  }
};

// ADD ADDRESS
let addAddress = async (req, res) => {
  const { name, address, district, state, zip, email, phone } = req.body;
  const userId = req.user.id;

  try {
    // new address
    const newAddress = {
      name,
      address,
      district,
      state,
      zip,
      email,
      phone,
    };

    const user = await User.findById({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.addresses.push(newAddress);

    await user.save();

    const addedAddress = user.addresses[user.addresses.length - 1];

    res
      .status(200)
      .json({ message: "Address added successfully", user, addedAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET ADDRSS FOR EDIT
let getAddressForEdiit = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addresses = user.addresses;

    return res.status(200).json({ addresses });
  } catch (error) {
    console.error(error);
    res.staus(500).json({ error: "an error occured" });
  }
};

// EDIT USER ADDRESS
let editAddress = async (req, res) => {
  const addressId = req.params.id;
  const { name, address, district, state, zip, email, phone } = req.body;
  7;
  try {
    const userForEditAddress = await User.findOne({ _id: req.user.id });

    if (!userForEditAddress) {
      return res.status(404).json({ error: "User not found" });
    }

    const addressIndex = userForEditAddress.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Update the address with new values
    userForEditAddress.addresses[addressIndex].name = name;
    userForEditAddress.addresses[addressIndex].address = address;
    userForEditAddress.addresses[addressIndex].district = district;
    userForEditAddress.addresses[addressIndex].state = state;
    userForEditAddress.addresses[addressIndex].zip = zip;
    userForEditAddress.addresses[addressIndex].email = email;
    userForEditAddress.addresses[addressIndex].phone = phone;

    let addressEdited = {
      name,
      address,
      district,
      state,
      zip,
      email,
      phone,
    };

    await userForEditAddress.save();

    res.status(200).json({ message: "address updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occured" });
  }
};

// DELETE ADDRESS
let deleteAddress = async (req, res) => {
  const addressId = req.params.addressId;
  const userId = req.user.id;

  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ error: "Address not found" });
    }

    user.addresses.splice(addressIndex, 1);

    await user.save();

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PLACE ORDER
let placeOrderPost = async (req, res) => {
  const { selectedAddressId, paymentMethod, totalPrice } = req.body;

  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // selected address from user's addresses
    const selectedAddress = user.addresses.find(
      (address) => address._id.toString() === selectedAddressId
    );

    if (!selectedAddress) {
      return res.status(404).json({ message: "Selected address not found" });
    }

    const allProducts = await Vendor.find({}).populate("products");
    let cart = [];

    user.cart.products.forEach((cartProduct) => {
      const productId = cartProduct.productId;
      // Find the product in allProducts
      allProducts.forEach((vendor) => {
        vendor.products.forEach((product) => {
          if (product._id.equals(productId)) {
            const vendorInfo = {
              vendorId: vendor._id,
              vendorName: vendor.vendorName,
            };

            const productDetails = {
              _id: product._id,
              name: product.productName,
              category: product.productCategory,
              subcategory: product.productSubCategory,
              brand: product.productBrand,
              color: product.productColor,
              size: product.productSize,
              quantity: cartProduct.quantity,
              price: product.productPrice,
              mrp: product.productMRP,
              discount: product.productDiscount,
              images: product.productImages,
              description: product.productDescription,
              vendor: vendorInfo,
            };

            cart.push(productDetails);
            // UPDATE PRODUCT QUANTITY IN VENDORS INVENTORY
            const updatedProduct = vendor.products.find((p) =>
              p._id.equals(productId)
            );
            if (updatedProduct) {
              updatedProduct.productQTY -= cartProduct.quantity;
            }
          }
        });
      });
    });
    // UPDATE VENDOR
    await Promise.all(allProducts.map((vendor) => vendor.save()));

    const orderDate = new Date();
    const expectedDeliveryDate = new Date(orderDate);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 4);
    const formattedDeliveryDate = expectedDeliveryDate.toLocaleDateString();

    const newOrder = {
      orderId: new mongoose.Types.ObjectId(),
      products: cart.map((product) => ({
        productId: product._id,
        qty: product.quantity,
        price: product.price,
        size: product.size,
      })),
      totalAmount: cart.reduce(
        (total, product) => total + product.price * product.quantity,
        0
      ),
      orderDate: new Date(),
      expectedDeliveryDate: formattedDeliveryDate,
      shippingAddress: selectedAddress,
      paymentMethod: paymentMethod,
    };

    user.orders.push(newOrder);

    await user.save();

    // Send a response with the new order details
    res.status(201).json({
      message: "Order placed successfully!",
      orderId: newOrder.orderId,
      totalAmount: newOrder.totalAmount,
      shippingAddress: newOrder.shippingAddress,
      paymentMethod: newOrder.paymentMethod,
      expectedDeliveryDate: formattedDeliveryDate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PLACE ORDER RAZORPAY - STARTS HERE
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});
let placeOrderPostRazorpay = async (req, res) => {
  const { totalPrice } = req.body;
  const keyId = process.env.RAZORPAY_ID_KEY;

  const options = {
    amount: totalPrice * 100,
    currency: "INR",
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, keyId });
  } catch (error) {
    console.error("Error creating order :", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};
let successfulRazorpayOrder = async (req, res) => {
  console.log(req.body);
  const { razorpay_payment_id, razorpay_order_id } = req.body.response;
  const { selectedAddressId, paymentMethod } = req.body;
  try {
    console.log("user :", req);
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // selected address from user's addresses
    const selectedAddress = user.addresses.find(
      (address) => address._id.toString() === selectedAddressId
    );

    if (!selectedAddress) {
      return res.status(404).json({ message: "Selected address not found" });
    }

    // ALL PRODUCTS
    const allProducts = await Vendor.find({}).populate("products");
    let cart = [];

    user.cart.products.forEach((cartProduct) => {
      const productId = cartProduct.productId;

      // FIND PRODUCTS FROM ALL PRODUCTS
      allProducts.forEach((vendor) => {
        vendor.products.forEach((product) => {
          if (product._id.equals(productId)) {
            const vendorInfo = {
              vendorId: vendor._id,
              vendorName: vendor.vendorName,
            };

            const productDetails = {
              _id: product._id,
              name: product.productName,
              category: product.productCategory,
              subcategory: product.productSubCategory,
              brand: product.productBrand,
              color: product.productColor,
              size: product.productSize,
              quantity: cartProduct.quantity,
              price: product.productPrice,
              mrp: product.productMRP,
              discount: product.productDiscount,
              images: product.productImages,
              description: product.productDescription,
              vendor: vendorInfo,
            };

            cart.push(productDetails);
          }
        });
      });
    });

    const orderDate = new Date();
    const expectedDeliveryDate = new Date(orderDate);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 4);
    const formattedDeliveryDate = expectedDeliveryDate.toLocaleDateString();
    const newOrder = {
      orderId: new mongoose.Types.ObjectId(),
      products: cart.map((product) => ({
        productId: product._id,
        qty: product.quantity,
        price: product.price,
        size: product.size,
      })),
      totalAmount: cart.reduce(
        (total, product) => total + product.price * product.quantity,
        0
      ),
      orderDate: new Date(),
      expectedDeliveryDate: formattedDeliveryDate,
      shippingAddress: selectedAddress,
      paymentMethod: paymentMethod,
      razorPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    };

    user.orders.push(newOrder);

    await user.save();

    // Send a response with the new order details
    res.status(201).json({
      message: "Order placed successfully!",
      orderId: newOrder.orderId,

      totalAmount: newOrder.totalAmount,
      shippingAddress: newOrder.shippingAddress,
      paymentMethod: newOrder.paymentMethod,
      expectedDeliveryDate: formattedDeliveryDate,
    });
  } catch (error) {
    console.error("Error placing order throught razorpat payment :", error);
    res.status(500).json({ error: "An error occured" });
  }
};
// PLACE ORDER RAZORPAY - ENDS HERE

// USER PROFILE PAGE DISPLAY
let userProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate("orders");
    console.log("d :", user);
    const addresses = user.addresses;
    const allVendors = await Vendor.find({}).populate("products");

    let cart = findUserOrders(user, allVendors);
    cart.reverse();

    res.status(200).render("user/account", { user, cart, addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ORDER CANCELLATION REQUEST POST
let orderCancelRequestPost = async (req, res) => {
  const { orderId, productId } = req.params;
  const { cancelReason } = req.body;
  const userId = req.user.id;

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the order in the user's orders
    const order = user.orders.find((order) => order.orderId === orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the product in the order
    const product = order.products.find(
      (prod) => prod.productId.toString() === productId
    );
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    // Update the order status and set the cancellation reason
    product.orderStatus = "Requested for Cancellation";
    product.cancelReason = cancelReason;

    // Save the user with the updated order
    await user.save();

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// CHANGE PASSWORD POST PAGE
let changePasswordPost = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  console.log(currentPassword, newPassword);
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validatedPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!validatedPassword) {
      return res.status(400).json({ error: "Current password in incorrect" });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;

    await user.save();
    console.log("password changed successfully");
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

let updateUserDetails = async (req, res) => {
  const { newName, newEmail, newPhone } = req.body;
  console.log("user details check", req.body);
  console.log(newName, newEmail, newPhone);
  const userId = req.user.id;
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      res.status(404).json({ error: "User Not found" });
    }

    user.name = newName;
    user.email = newEmail;
    user.phoneNumber = newPhone;

    await user.save();
    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server side error" });
  }
};

// APPLY COUPON
let applyCoupon = async (req, res) => {
  const { couponCode, totalPrice } = req.body;

  try {
    const admin = await Admin.findOne();
    const coupon = admin.coupons.find(
      (coupon) => coupon.couponCode == couponCode
    );
    let discountAmount = 0;

    console.log(coupon);

    if (!coupon || coupon.couponStatus === "InActive") {
      return res.status(400).json({ message: "Invalid Coupon" });
    }

    if (coupon.couponType === "Fixed Amount") {
      discountAmount = coupon.discountValue;
      return res
        .status(200)
        .json({ message: "coupon applied successfully ", discountAmount });
    } else if (coupon.couponType === "Percentage") {
      discountAmount = (coupon.discountValue / 100) * totalPrice;
      return res
        .status(200)
        .json({ message: "coupon applied successfully ", discountAmount });
    }
  } catch (error) {
    console.error(error);
    res.staus(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  homePage,
  signupGetPage,
  signupPostPage,
  signupVerify,
  loginGetPage,
  loginPostPage,
  userLogout,
  userProfile,
  loadAuth,
  successGoogleLogin,
  failureGooglelogin,
  loginWithOtpGetPage,
  loginRequestOTP,
  loginVerifyOTP,
  forgotGetPage,
  forgotEmailPostPage,
  resetPassword,
  shopGetPage,
  getProductsByCategory,
  singleProductGetPage,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  addToCart,
  removeProductCart,
  getCart,
  updateCartQuantity,
  checkoutpage,
  addAddress,
  getAddressForEdiit,
  editAddress,
  deleteAddress,
  placeOrderPost,
  placeOrderPostRazorpay,
  successfulRazorpayOrder,
  buyNowCheckOut,
  orderCancelRequestPost,
  changePasswordPost,
  updateUserDetails,
  applyCoupon,
  getProductBySort,
  getSearchProduct,
};

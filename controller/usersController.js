const User = require("../models/usersModel");
const Vendor = require("../models/vendorsModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const smsService = require("../helpers/smsService");
const { sendOtpEmail } = require("../helpers/emailService");
require("dotenv").config();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// HOME PAGE DISPLAY
let homePage = async (req, res) => {
  try {
    let products = await Vendor.find().select("products");
    res.status(200).render("user/home", { products: products });
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

    if(user.blocked){
      return res.status(403).json({error: "You are restricted by admin"})
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

    console.log(phone);
    const user = await User.findOne({ phoneNumber: phone });

    if (!user) {
      return res
        .status(404)
        .render("user/loginOtpPhone", { error: "User not found" });
    }

    if(user.blocked){
      return res.status(403).render("user/loginOtpPhone", { error: "Your are restricted by admin" })
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
  console.log(emailOrPhone);
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
      await smsService.sendOTP(emailOrPhone, otp);
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
  try {
    let products = await Vendor.find().select("products");
    res.status(200).render("user/shop", { products: products });
  } catch (error) {
    console.log("page not found :", error);
    res.status(404).send("page not found");
  }
};
 
// DISPLAY SINGLE PRODUCT PAGE
let singleProductGetPage = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(productId);
    const vendors = await Vendor.find();
    let products;
    vendors.forEach((vendor) => {
      vendor.products.forEach((prod) => {
        if (prod._id.toString() === productId) {
          products = prod;
        }
      });
    });
    console.log(products);
    res.render("user/singleProduct", { products: products });
  } catch (error) {
    console.log("page not found :", error);
    res.status(404).send("page not found");
  }
};

// USER PROFILE PAGE DISPLAY
let userProfile = async (req, res) => {
  console.log(req.user);
  const user = req.user;
  res.render("user/account", { user });
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
  singleProductGetPage,
};

const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
require("dotenv").config();


// HOME PAGE DISPLAY
let homePage = (req, res) => {
  try {
    res.status(200).render("user/home");
    // res.status(200).render("user/home", { user: res.locals.user });
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

    const newUser = new User({
      name: userName,
      email,
      phoneNumber: phone,
      password: hashedPassword,
    });

    await newUser.save();

    console.log(newUser);

    res.status(201).redirect("/login");
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
};

// USER LOGIN PAGE DISPLAY
let loginGetPage = async (req, res) => {
  try {
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

    console.log(req.user);

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

// .ENV DETAILS
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
    await user.save();
    console.log(`generated otp is :${otp}`);

    // Send OTP via Twilio SMS
    try {

      await client.messages.create({
        body:`your otp for login to watchVista is: ${otp}`,
        from:twilioPhoneNumber,
        to: phone,
    })
      console.log("OTP SMS sent");
    } catch (error) {
      console.error("Error sending OTP SMS:", error);
      return res.status(500).json({ message: "Error sending OTP" });
    }

    res.render("user/loginOtp", { phone });
  } catch (error) {
    console.error("Error requesting OTP:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const loginVerifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const user = await User.findOne({ phoneNumber });


    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || Date.now() > user.otpExpiration) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
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

////////////////////////////////////////////////
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: "watchvista6@gmail.com",
    to: email,
    subject: "Reset Your Password",
    text: `Your OTP to reset your password is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
////////////////////////////////////////////

// FORGOT EMAIL POST + OTP GENERATION AND MAIL SEND
let forgotEmailPostPage = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiration = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
    await user.save();

    await sendOtpEmail(email, otp);

    res.render("user/forgototp", { email });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// RESET PASSWORD
let resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || Date.now() > user.otpExpiration) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const bcryptedNewPassword = await bcrypt.hash(newPassword, 10);
    // Reset password
    user.password = bcryptedNewPassword;
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();
    console.log("password resetted");

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
    res.status(200).render("user/shop");
  } catch (error) {
    console.log("page not found :", error);
    res.status(404).send("page not found");
  }
};

// DISPLAY SINGLE PRODUCT PAGE
let singleProductGetPage = async (req, res) => {
  try {
    res.status(200).render("user/singleProduct");
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

const User = require("../models/usersModel");
const bcrypt = require("bcryptjs"); // for hashing password
const jwt = require("jsonwebtoken");
require("dotenv").config();

//HOME PAGE DISPLAY
let homePage = (req, res) => {
  try {
    res.render("user/home");
    res.status(200);
  } catch (error) {
    console.error("Failed to get home:", error);
    res.status(500).send("Internal Server Error");
  }
};

//USER SIGNUP PAGE DISPLAY
let signupGetPage = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    console.error("Failed to get login page:", error);

    res.status(500).send("Internal Server Error");
  }
};

//USER SIGNUP
let signupPostPage = async (req, res) => {
  try {
    const { userName, email, phoneNumber, password } = req.body;

    // HASHED PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    await newUser.save();

    console.log(newUser);

    res.redirect("/login");

    res.status(201);
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
};

//USER LOGIN PAGE DISPLAY
let loginGetPage = async (req, res) => {
  try {
    res.render("user/login", { Err: " " });
  } catch (error) {
    console.error("Failed to get login page:", error);

    res.status(500).send("Internal Server Error");
  }
};

//USER LOGIN
let loginPostPage = async (req, res) => {
  try {
    const foundUser = await User.findOne({ email: req.body.email });

    if (foundUser) {
      const passworMatch = await bcrypt.compare(
        req.body.password,
        foundUser.password
      );

      if (passworMatch) {
        res.redirect("/");
        console.log("user loged");
      } else {
        res.render("user/login", { Err: "Invalid Password" });
      }
    } else {
      res.render("user/login", { Err: "User not found" });
    }
  } catch (error) {
    res.render("user/login", { Err: "Internal server error" });
  }
};

// USER PROFILE PAGE DISPLAY
let userProfile = async (req, res) => {
  res.render("user/account");
};

module.exports = {
  homePage,
  signupGetPage,
  signupPostPage,
  loginGetPage,
  loginPostPage,
  userProfile,
};

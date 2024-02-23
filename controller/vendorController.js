const Vendor = require("../models/vendorsModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const initializeSession = (req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
};

// VENDOR LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  try {
    res.status(200).render("vendor/vendorLogin");
  } catch (error) {
    res.status(500).send("server error : ", error);
  }
};

// VENDOR REGISTER PAGE DISPLAY
let registerGetPage = async (req, res) => {
  try {
    res.status(200).render("vendor/vendorRegister");
  } catch (error) {
    res.status(404).send("page not found");
  }
};

// VENDOR REGISTER POST PAGE
let vendorRegisterPostPage = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newVendor = new Vendor({
        vendorName : name,
        email,
        phoneNumber:phone,
        password:hashedPassword
    })

    console.log(newVendor);

    await newVendor.save()

    console.log(newVendor);

    res.status(201).redirect("/vendor")
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
};

// VENDOR LOGIN POST PAGE
let vendorLoginPostPage = async (req, res)=>{
  try {
    const foundVendor = await Vendor.findOne({ email: req.body.email });

    if (foundVendor) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        foundVendor.password
      );

      if (passwordMatch) {
        req.session.user = {
          id: foundVendor._id,
          userName: foundVendor.userName,
          email: foundVendor.email,
        };

        res.status(200).render("vendor/index");
        console.log("Vendor logged in successfully");
      } else {
        res.status(200).render("user/login", { error: "Wrong password" });
      }
    } else {
      console.log("Vendor not found:", req.body.email);
      res.status(200).render("user/login", { error: "User not found" });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).render("user/login", { error: "Internal server error" });
  }
}

module.exports = {
  initializeSession,
  loginGetPage,
  registerGetPage,
  vendorRegisterPostPage,
  vendorLoginPostPage
};

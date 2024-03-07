const Vendor = require("../models/vendorsModel");
const Admin = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinary')

require("dotenv").config();

// VENDOR DASHBOARD PAGE DISPLAY
let dashboard = async (req, res) => {
  try {
    let email = req.user.email;
    let vendor = await Vendor.findOne({ email });
    console.log(vendor);
    res.status(200).render("vendor/dashboard", { vendor });
  } catch (error) {
    res.status(404).send("page not found");
  }
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
      vendorName: name,
      email,
      phoneNumber: phone,
      password: hashedPassword,
    });

    console.log(newVendor);

    await newVendor.save();

    console.log(newVendor);

    res.status(201).redirect("/vendor/login");
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
};

// VENDOR LOGIN POST PAGE
let vendorLoginPostPage = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ email: req.body.email });

    if (vendor) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        vendor.password
      );

      if (passwordMatch) {
        const token = jwt.sign(
          {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
          },
          process.env.JWT_KEY,
          {
            expiresIn: "24h",
          }
        );

        res.cookie("vendor_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry

        res.status(200).redirect("/vendor/dashboard");
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
};

// ADD PRODUCT PAGE DISPLAY
let addProduct = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    const categories = admin.category;
    const subcategories = admin.subcategory;
    res.status(200).render("vendor/product-add", { categories, subcategories });
  } catch (error) {
    console.error(error);
    res.status(404).send("page not found");
  }
};

// ADD PRODUCT POST PAGE
let addProductpost = async (req, res) => {
  try {
    let { email } = req.user;
    let imageData = req.files;
    let productData = req.body

    let vendor = await Vendor.findOne({ email });

    const imageUrls = [];

    if(productData){
      for (const file of imageData) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
      console.log(imageUrls);
    }else{
      console.log("No product data found");
    }

    // Create a new Product instance with uploaded image URLs
    const newProduct = {
      productName: req.body.productName,
      productCategory: req.body.productCategory,
      productSubCategory: req.body.productSubcategory,
      productBrand: req.body.productBrand,
      productColor: req.body.productColor,
      productSize: req.body.productSize,
      productQTY: req.body.productQuantity,
      productPrice: req.body.productPrice,
      productMRP: req.body.productMRP,
      productDiscount: req.body.productDiscount,
      productImages: imageUrls,
      productDescription: req.body.productDescription,
    };
    vendor.products.push(newProduct);
    await vendor.save();
    res.redirect("/vendor/productList")
    console.log("product added successful")
  } catch (error) {
    console.log(error);
  }
};

// PRODUCT LIST
let producList = async (req, res) => {
  try {
    let _id = req.user.id
    const vendor = await Vendor.findOne({_id})
    let products = vendor.products
    console.log("product : ", products)
    res.status(200).render("vendor/product-list",{products})
  } catch (error) {
    console.error("vendor product list error", error)
    res.status(404).send("page not found")
  }
};

// VENDOR LOGOUT
let vendorLogout = (req, res) => {
  try {
    // Clear the JWT cookie
    res.clearCookie("vendor_jwt");

    res.redirect("/vendor/login");
    console.log("vendor logged out");
    return;
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loginGetPage,
  registerGetPage,
  vendorRegisterPostPage,
  vendorLoginPostPage,
  dashboard,
  vendorLogout,
  addProduct,
  addProductpost,
  producList,
};

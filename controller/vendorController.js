const Vendor = require("../models/vendorsModel");
const Admin = require("../models/adminModel");
const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../helpers/emailService");
const cloudinary = require("../config/cloudinary");
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

require("dotenv").config();

// VENDOR DASHBOARD PAGE DISPLAY
let dashboard = async (req, res) => {
  try {
    let email = req.user.email;
    let vendor = await Vendor.findOne({ email });
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

    if (vendor.status) {
      return res.render("vendor/vendorLogin", {
        error: "you are restricted by admin",
      });
    } else if (vendor) {
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
        res
          .status(200)
          .render("vendor/VendorLogin", { error: "Wrong password" });
      }
    } else if (!vendor) {
      console.log("Vendor not found:", req.body.email);
      res.status(200).render("vendor/vendorLogin", { error: "User not found" });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    res
      .status(500)
      .render("vendor/vendorLogin", { error: "Internal server error" });
  }
};

// ADD PRODUCT PAGE DISPLAY
let addProduct = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    const categories = admin.categories.map((category) => ({
      categoryName: category.categoryName,
      subcategories: category.subcategories.map(
        (subcategory) => subcategory.subcategoryName
      ),
    }));

    console.log(categories);
    res.status(200).render("vendor/product-add", { categories });
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
    let productData = req.body;

    let vendor = await Vendor.findOne({ email });

    const imageUrls = [];

    if (productData) {
      for (const file of imageData) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
    } else {
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
    res.redirect("/vendor/productList");
    console.log("product added successful");
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
};

// PRODUCT LIST
let producList = async (req, res) => {
  try {
    let _id = req.user.id;
    const vendor = await Vendor.findOne({ _id });
    let products = vendor.products;
    res.status(200).render("vendor/product-list", { products });
  } catch (error) {
    console.error("vendor product list error", error);
    res.status(404).send("page not found");
  }
};

// EDIT PRODUCT GET PAGE
let editProduct = async (req, res) => {
  try {
    let productId = req.params.id;

    let vendorId = req.user.id;
    let vendor = await Vendor.findOne({ _id: vendorId });
    if (!vendor) {
      res.status(400).send("Vendor not found");
    }

    let admin = await Admin.findOne();
    let product = vendor.products.find(
      (prod) => prod._id.toString() === productId
    );
    if (!product) {
      return res.status(404).send("Product Not Found");
    }

    const categories = admin.categories.map((category) => ({
      categoryName: category.categoryName,
      subcategories: category.subcategories.map(
        (subcategory) => subcategory.subcategoryName
      ),
    }));
    res.render("vendor/product-edit", { product, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("failed to get editproduct page");
  }
};

// EDIT PRODUDT POST PAGE
let editProductPost = async (req, res) => {
  try {
    let productId = req.params.id;
    let vendorId = req.user.id;
    const imageUrls = [];

    if (req.files) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
    }

    let vendor = await Vendor.findOne({ _id: vendorId });

    let productIndex = await vendor.products.findIndex(
      (product) => product._id.toString() === productId
    );

    if (productIndex === -1) {
      res.status(404).send("Product Not Found");
    } else {
      let updatedProduct = vendor.products[productIndex];
      updatedProduct.productName = req.body.productName;
      updatedProduct.productCategory = req.body.productCategory;
      updatedProduct.productSubCategory = req.body.productSubcategory;
      updatedProduct.productBrand = req.body.productBrand;
      updatedProduct.productColor = req.body.productColor;
      updatedProduct.productSize = req.body.productSize;
      updatedProduct.productQTY = req.body.productQuantity;
      updatedProduct.productPrice = req.body.productPrice;
      updatedProduct.productMRP = req.body.productMRP;
      updatedProduct.productDiscount = req.body.productDiscount;
      updatedProduct.productDescription = req.body.productDescription;
      updatedProduct.productImages = imageUrls;
      await vendor.save();

      res.status(200).redirect("/vendor/productList");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("server error edit failed");
  }
};

// DELETE PRODUCT POST PAGE
let deleteProduct = async (req, res) => {
  try {
    let vendorId = req.user.id;
    let productId = req.params.id;

    // FINDING VENDOR
    let vendor = await Vendor.findOne({ _id: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // FINDING THE INDEX OF THE PRODUCT
    const productIndex = vendor.products.findIndex((product) => {
      product._id.toString() === productId;
    });

    // REMOVING PRODUCTS FORM THE PRODUCT ARRAY
    vendor.products.splice(productIndex, 1);

    await vendor.save();

    res.status(200).redirect("/vendor/productList");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// FORGOT PASSWORD
let forgotEmail = async (req, res) => {
  try {
    res.status(200).render("vendor/vendorForgotEmail");
  } catch (error) {
    res.statusf(404).send("page not found");
  }
};
let forgotPassEmailPost = async (req, res) => {
  try {
    const email = req.body.email;
    const vendor = await Vendor.find({ email });
    if (!vendor) {
      return res
        .status(404)
        .render("vendor/vendorForgotEmail", { error: "User not found" });
    }
    const otp = generateOTP();
    req.session.otp = otp;
    req.session.email = email;
    const message = `your otp for reset password is ${otp}`;
    await sendOtpEmail(email, message);

    res.status(200).render("vendor/forgotOtp");
  } catch (error) {
    console.error(error);
    res.status(500).send("error occured try after some time");
  }
};
let forgotOrpVerify = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const email = req.session.email;
    const storedOTP = req.session.otp;
    const vendor = await Vendor.findOne({ email });
    const bcryptedPass = await bcrypt.hash(newPassword, 10);
    if (otp == storedOTP) {
      vendor.password = bcryptedPass;
      vendor.save();

      delete req.session.otp;
      delete req.session.email;
      console.log("vendor password resetted");
      res.render("vendor/vendorLogin");
    } else {
      res.status(400).render("vendor/forgotOtp", { error: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occured try again later");
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

// VENDOR ORDER DISPLAY
let getOrdersForVendor = async (req, res) => {
  try {
    // Find the user based on the vendorId (req.user.id)
    const user = await User.findOne({
      "orders.products.sellerId": req.user.id,
    });
    if (!user) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Group orders by sellerId for this vendor
    const ordersByVendor = {};
    user.orders.forEach((order) => {
      order.products.forEach((product) => {

        const sellerId = product.sellerId;
        if (sellerId === req.user.id) {
          if (!ordersByVendor[sellerId]) {
            ordersByVendor[sellerId] = [];
          }
          ordersByVendor[sellerId].push({
            orderId: order.orderId,
            productName: product.productName,
            quantity: product.quantity,
            price: product.price,
            color: product.color,
            status: order.orderStatus,  
            address: `${order.shippingAddress.name}, ${order.shippingAddress.address}, ${order.shippingAddress.district}, ${order.shippingAddress.state} ${order.shippingAddress.zip},`,
          });
        }
      });
    });

    // Fetch vendor details for this vendor
    const vendorDetails = await Vendor.findOne({ _id: req.user.id });
    const vendorName = vendorDetails
      ? vendorDetails.vendorName
      : "Unknown Vendor";

    // Pass data to the EJS view
    res.render("vendor/order-list", {
      title: "Vendor Orders",
      vendorName: vendorName,
      ordersByVendor: ordersByVendor[req.user.id] || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ORDER STATUS UPDATE
let updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  console.log("sfhkdf: ",orderId , status)

  try {
    // Find the order by orderId and update the status
    const user = await User.findOneAndUpdate(
      { "orders.orderId": orderId },
      { $set: { "orders.$.orderStatus": status } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  loginGetPage,
  registerGetPage,
  vendorRegisterPostPage,
  vendorLoginPostPage,
  forgotEmail,
  forgotPassEmailPost,
  forgotOrpVerify,
  dashboard,
  vendorLogout,
  addProduct,
  addProductpost,
  producList,
  editProduct,
  editProductPost,
  deleteProduct,
  getOrdersForVendor,
  updateOrderStatus,
};

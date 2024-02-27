const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken")

//ADMIN DASHBOARD DISPLAY
let dashboardPage = (req, res) => {
  try {
    res.render("admin/index");
    res.status(200);
  } catch (error) {
    console.error("Failed to get dashboard:", error);
    res.status(500).send("Internal Server Error");
  }
};

//ADMIN LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  try {
    res.status(200).render("admin/adminlogin");
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

//ADMIN LOGIN
let loginPostPage = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (admin) {
      if (req.body.password === admin.password) {

        const token = jwt.sign(
          {
            id: admin._id,
            name: admin.name,
            email: admin.email,
          },
          process.env.JWT_KEY,
          {
            expiresIn: "24h",
          }
        );

        res.cookie("jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry


        res.status(200).render("admin/index");
        console.log("Admin logged in successfully, jwt created");
      } else {
        res.status(401).render("admin/adminlogin", { error: "Wrong password" });
      }
    } else {
      console.log("User not found:", req.body.email);
      res.status(404).render("admin/adminlogin", { error: "User not found" });
    }
  } catch (error) {
    
    console.error("Internal server error:", error);
    res.status(500).render("admin/adminlogin", { error: "Internal server error" });
  }
};

//ADMIN LOGOUT
let adminLogout = (req, res) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/login"); // If no token, redirect to login
  }


  
  try {
    // Clear the JWT cookie
    res.clearCookie("jwt");

    res.redirect("/admin");
    console.log("Admin logged out");
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loginGetPage,
  loginPostPage,
  adminLogout,
  dashboardPage,
};

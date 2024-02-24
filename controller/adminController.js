const Admin = require("../models/adminModel");

const initializeSession = (req, res, next) => {
  if (req.session.admin) {
    res.locals.user = req.session.user;
  }
  next();
};

//ADMIN DASHBOARD DISPLAY
let dashboardPage = (req, res) => {
  try {
    res.render("admin/index");
    res.status(200);
  } catch (error) {
    console.error("Failed to get dasgboard:", error);
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
        req.session.admin = {
          id: admin._id,
          userName: admin.name,
          email: admin.email,
        };

        res.status(200).render("admin/index");
        console.log("Admin logged in successfully");
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
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/admin");
    console.log("admin logged out");
  });
};

module.exports = {
  loginGetPage,
  loginPostPage,
  adminLogout,
  dashboardPage,
  initializeSession,
};

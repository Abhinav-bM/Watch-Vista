const Admin = require("../models/adminModel");
const User = require("../models/usersModel")
const jwt = require("jsonwebtoken");

// ADMIN LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  try {
    res.render("admin/adminLogin");
  } catch (error) {
    res.status(500).json({msg:"Internal server error"});
  }
};


// ADMIN LOGIN
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

        res.cookie("admin_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry

        res.redirect("/admin/dashboard");
        console.log("Admin logged in successfully, jwt created");
        return;
      } else {
        res.status(401).render("admin/adminlogin", { error: "Wrong password" });
        return
      }
    } else {
      console.log("User not found:", req.body.email);
      res.status(404).render("admin/adminlogin", { error: "User not found" });
      return
    }
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).render("admin/adminlogin", { error: "Internal server error" });
    return
  }
};

// ADMIN DASHBOARD DISPLAY
let dashboardPage = (req, res) => {
  try {
    const user = req.user
    res.render("admin/dashboard",{user})
  } catch (error) {
    res.status(500).json({msg:"server side error"})
  }
};

// CUSTOMERS LIST
let customersList = async (req, res)=>{
  try {
    let user = await User.find()
    console.log(user);
    res.render("admin/customersList",{user})
  } catch (error) {
    console.log(error);
  }
}

//ADMIN LOGOUT
let adminLogout = (req, res) => {
  try {
    // Clear the JWT cookie
    res.clearCookie("admin_jwt");

    res.redirect("/adminLogin");
    console.log("Admin logged out");
    return
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loginGetPage,
  loginPostPage,
  dashboardPage,
  customersList,
  adminLogout,
  
};

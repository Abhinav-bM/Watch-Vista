const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  
  const token = req.cookies.jwt; // Assuming you're using cookies for token storage

  if (!token) {
    return res.render("user/login"); // If no token, redirect to login
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.render("user/login");
  }
};

// ADMIN
const adminAuthMiddleware = (req, res, next) => {
  // Get token from cookies
  const token = req.cookies.admin_jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_KEY, (err, decodedToken)=>{
      if(err){
        // Token expired or invalid 
        res.redirect("/adminLogin")
      }
      else{
        // Token is valid and attach decoded token to request
        req.user = decodedToken
        next()
      }
    })
  }else{
    // No token provided
    res.redirect("/adminLogin")
  }
};



// ADMIN
const vendorAuthMiddleware = (req, res, next) => {
  // Get token from cookies
  const token = req.cookies.vendor_jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_KEY, (err, decodedToken)=>{
      if(err){
        // Token expired or invalid 
        res.redirect("/vendor/login")
      }
      else{
        // Token is valid and attach decoded token to request
        req.user = decodedToken
        next()
      }
    })
  }else{
    // No token provided
    res.redirect("/vendor/login")
  }
};

module.exports = {
  verifyToken,
  adminAuthMiddleware,
  vendorAuthMiddleware,
};

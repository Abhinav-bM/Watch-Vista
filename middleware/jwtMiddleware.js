const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  
  const token = req.cookies.jwt; // token from cookie
  if (!token) {
    return res.render("user/login");
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

  const token = req.cookies.admin_jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_KEY, (err, decodedToken)=>{
      if(err){
        res.redirect("/admin/login")
      }
      else{
        req.user = decodedToken
        next()
      }
    })
  }else{
    // No token provided
    res.redirect("/admin/login")
  }
};



// ADMIN
const vendorAuthMiddleware = (req, res, next) => {

  const token = req.cookies.vendor_jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_KEY, (err, decodedToken)=>{
      if(err){
        // Token expired or invalid 
        res.redirect("/vendor/login")
      }
      else{
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

const jwt = require('jsonwebtoken');
const { isInBlacklist } = require("../controller/usersController");

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt; // Assuming you're using cookies for token storage

  if (isInBlacklist(token)) {
    // return res.status(401).json({ message: "Token revoked, please log in again" });
    return res.redirect("/login")
  }


  if (!token) {
    // return res.status(401).json({ error: 'Access denied. No token provided.' });
    return res.redirect("/login")
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).redirect("/login")
  }
};

module.exports = verifyToken;
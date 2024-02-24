const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect("/admin/login"); // Redirect to the login page if not authenticated
};

const ensureAuthenticatedUser = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect("/login"); // Redirect to the login page if not authenticated
};
module.exports = { ensureAuthenticated,ensureAuthenticatedUser };

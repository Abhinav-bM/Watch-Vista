let preventBack = (req, res, next) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale = 0, post-check = 0, pre-check = 0"
  );
  next();
};

module.exports = preventBack;

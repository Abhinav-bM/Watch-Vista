const multer = require('multer');
// const path = require('path');

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// Multer file filter
const fileFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true); // Accept image files only
    } else {
      cb(new Error("Please upload only images."), false);
    }
  };
  
  // Initialize multer instance
  const upload = multer({ storage: storage, fileFilter: fileFilter });

  module.exports = upload;
  
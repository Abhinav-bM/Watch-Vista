const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String },
  password: { type: String },
  otp: { type: String },
  otpExpiration: { type: Date },
});

module.exports = mongoose.model("User", userSchema);

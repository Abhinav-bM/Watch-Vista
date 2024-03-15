const mongoose = require("mongoose");

// CART SCHEMA
const cartSchema = new mongoose.Schema({
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId },
      quantity: { type: Number, default: 1 },
      productName: { type: String },
      price: { type: Number },
      images: { type: Array },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String, unique: true },
  password: { type: String },
  cart: { type: cartSchema , default: { products: [] }},
  createdAt: { type: Date, default: new Date() },
  otp: { type: String },
  otpExpiration: { type: Date },
  blocked: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);

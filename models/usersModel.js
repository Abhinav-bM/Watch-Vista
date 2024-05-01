const mongoose = require("mongoose");

// ADDRESS SCHEMA
const addressSchema = new mongoose.Schema(
  {
    name: { type: String },
    address: { type: String },
    district: { type: String },
    state: { type: String },
    zip: { type: Number },
    phone: { type: Number },
    email: { type: String },
  },
  { _id: true }
);

// CART SCHEMA
const cartSchema = new mongoose.Schema({
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "vendor.products",
      },
      quantity: { type: Number, default: 1 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// WIHSLIST SCHEMA
const wishlistSchema = new mongoose.Schema({
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "vendor.products",
      },
    },
  ],
});

// ORDER SCHEMA
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        size: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        orderStatus: {
          type: String,
          default: "Pending", 
        },
        cancelReason: { type: String },
        returnReason: { type: String }, 
        refundMethod: { type: String }, 
        refundDetails: { 
          bankName: { type: String },
          accountHolderName: { type: String },
          accountNumber: { type: String },
          ifsc: { type: String },
        },
        deliveredDate: { type: Date }, // New field for delivered date
      },
    ],
    totalAmount: { type: Number },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: String },
    shippingAddress: { type: addressSchema },
    paymentMethod: { type: String, require: true },
    razorPaymentId: { type: String },
    razorpayOrderId: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String, unique: true },
  password: { type: String },
  wishlist: { type: wishlistSchema, default: { products: [] } },
  cart: { type: cartSchema, default: { products: [] } },
  addresses: [addressSchema],
  orders: [orderSchema],
  createdAt: { type: Date, default: new Date() },
  otp: { type: String },
  otpExpiration: { type: Date },
  blocked: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);

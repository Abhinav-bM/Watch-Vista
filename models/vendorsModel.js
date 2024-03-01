const mongoose = require("mongoose");

// PRODUCT IMAGE SCHEMA
const productImageSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
});

// PRODUCT SCHEMA
const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productCategory: { type: String, required: true },
  productSubCategory: { type: String, required: true },
  productBrand: { type: String, required: true },
  productColor: { type: String, required: true },
  productSizeAndQty: [{ 
    size: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  productPrice: { type: Number, required: true },
  productMRP: { type: Number, required: true },
  productDiscount: { type: Number, required: true },
  productImages: [productImageSchema],
  productDescription: { type: String, required: true }
}, { timestamps: true });


const vendorSchema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  JoinedAt:{
    type:Date,
    default:Date.now
  },
  products:[productSchema]
});

module.exports = mongoose.model("vendor", vendorSchema);
  
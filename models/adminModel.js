const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  subcategoryName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  subcategories: [subcategorySchema]
});

const couponSchema = new mongoose.Schema({
  couponCode :  {type:String},
  couponStatus :{type:String},
  discountProducts :{type:String},
  couponLimit :{type : Number},
  couponType:{type:String},
  discountValue :{type:Number},
  startDate:{type:Date},
  endDate:{type:Date}
})

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  categories :[categorySchema],
  coupons : [couponSchema]
});

module.exports = mongoose.model("Admin", adminSchema);

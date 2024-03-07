const mongoose = require("mongoose");


// PRODUCT SCHEMA
const productSchema = new mongoose.Schema({
  productName: { type: String,  },
  productCategory: { type: String,  },
  productSubCategory: { type: String, },
  productBrand: { type: String, },
  productColor: { type: String, },
  productSize: { type: String,},
  productQTY: { type: Number,  },
  productPrice: { type: Number,  },
  productMRP: { type: Number,  },
  productDiscount: { type: Number,  },
  productImages: {type:Array},
  productDescription: { type: String,  }
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
  
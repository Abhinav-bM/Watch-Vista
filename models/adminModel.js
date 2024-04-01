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

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  categories :[categorySchema],
  visitorCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Admin", adminSchema);

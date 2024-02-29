const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  category: [
    { categoryName: String, createdAt: { type: Date, default: Date.now } },
  ],
  subcategory: [{ subcategoryName: String ,createdAt: { type: Date, default: Date.now }}],
});

module.exports = mongoose.model("Admin", adminSchema);

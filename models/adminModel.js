const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mail:{type:String,unique:true,required:true},
  password: { type: String, required: true },
});

module.exports = mongoose.model("Admin", adminSchema);

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRouter = require("./routes/users");
require("dotenv").config();
const path = require("path");
const app = express();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "views")));
app.use(express.static("public"));

//CONNECT TO MONGODB
mongoose.connect("mongodb://localhost:27017/watch-store", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Parse incoming request bodies
// app.use(bodyParser.json());

// // Set up routes
// app.use('/auth', authRoutes);
app.use("/", userRouter);

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

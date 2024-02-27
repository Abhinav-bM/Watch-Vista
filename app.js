const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const vendorRouter = require("./routes/vendor");

// const passport = require("./passport")
require("dotenv").config();
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

app.use(express.json());
app.use(cookieParser());

// Set up session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
  })
);

app.set("view engine", "ejs");

const { parsed: config } = require("dotenv").config();
global.config = config;

//CONNECT TO MONGODB
mongoose.connect("mongodb://localhost:27017/watch-store", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// // Set up routes
app.use("/", userRouter);
app.use("/", adminRouter);
app.use("/", vendorRouter);

// Start the server
app.listen(3000, () => {
  console.log(`Server is running on : http://localhost:${process.env.PORT}`);
});

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const vendorRouter = require("./routes/vendor");


const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static("uploads"));

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
require("dotenv").config();
mongoose.connect(process.env.MONGODCo,{
  dbName:'watch-store',
  connectTimeoutMS:30000
})
.then((data)=>
{ 
  console.log("DB Connected");
}).catch((err)=>
{
  console.log(err);
})

// // Set up routes
app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use("/vendor", vendorRouter);

app.use((req, res, next) => {
  res.status(404).render("user/notFound");
});

// Start the server
app.listen(3000, () => {
  console.log(`Server is running on : http://localhost:${process.env.PORT}`);
});

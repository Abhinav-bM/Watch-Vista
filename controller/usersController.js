const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");

const initializeSession = (req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
};

// HOME PAGE DISPLAY
let homePage = (req, res) => {
  try {
    res.render("user/home", { user: res.locals.user });
    res.status(200);
  } catch (error) {
    console.error("Failed to get home:", error);
    res.status(500).send("Internal Server Error");
  }
};

// AUTH
const loadAuth = (req,res) =>[
  res.render('auth')
]

// USER SIGNUP PAGE DISPLAY
let signupGetPage = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    console.error("Failed to get login page:", error);
    res.status(500).send("Internal Server Error");
  }
};

// USER SIGNUP
let signupPostPage = async (req, res) => {
  try {
    const { userName, email, phoneNumber, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    await newUser.save();

    console.log(newUser);

    res.redirect("/login");

    res.status(201);
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
};

// USER LOGIN PAGE DISPLAY
let loginGetPage = async (req, res) => {
  try {
    res.render("user/login", { Err: " " });
  } catch (error) {
    console.error("Failed to get login page:", error);
    res.status(500).send("Internal Server Error");
  }
};

// USER LOGIN
let loginPostPage = async (req, res) => {
  try {
    const foundUser = await User.findOne({ email: req.body.email });

    if (foundUser) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        foundUser.password
      );

      if (passwordMatch) {
        req.session.user = {
          id: foundUser._id,
          userName: foundUser.userName,
          email: foundUser.email,
        };

        res.status(200).redirect("/");
        console.log("User logged in successfully");
      } else {
        res.status(401).render("user/login", { error: "Wrong password" });
      }
    } else {
      console.log("User not found:", req.body.email);
      res.status(404).render("user/login", { error: "User not found" });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).render("user/login", { error: "Internal server error" });
  }
};

//LOGIN WITH GOOGLE
const succesGoogleLogin = (req, res) => {
  if (!req.user) res.redirect("/failure");
  console.log(req.user);
  res.redirect("/");
};

const failureGooglelogin = (req, res) => {
  res.send("Error");
};

// USER LOGOUT
let userLogout = (req, res) => {
  if (!req.session.user) {
    // User is already logged out, redirect to a page with a message
    const alertScript = `
      <script>
        alert("You are already logged out.");
        window.location.href = "/login";
      </script>
    `;
    return res.send(alertScript);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/login");
    console.log("User logged out");
  });
};

// USER PROFILE PAGE DISPLAY
let userProfile = async (req, res) => {
  res.render("user/account", { user: res.locals.user });
};

module.exports = {
  homePage,
  signupGetPage,
  signupPostPage,
  loginGetPage,
  loginPostPage,
  userLogout,
  userProfile,
  initializeSession,
  loadAuth,
  succesGoogleLogin,
  failureGooglelogin,
};

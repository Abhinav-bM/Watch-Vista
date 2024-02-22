const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

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
const loadAuth = (req, res) => [res.render("auth")];

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

// LOGIN WITH GOOGLE
const successGoogleLogin = async (req, res) => {
  try {
    if (!req.user) {
      // If no user data
      return res.status(401).send("no user data , login failed");
    }

    console.log(req.user);

    // Checking user already exists in database
    let user = await User.findOne({ email: req.user.email });

    if (!user) {
      // If the user does not exist, create a new user
      user = new User({
        userName: req.user.displayName,
        email: req.user.email,
      });

      // Save the new user to the database
      await user.save();
    }

    // Log the user in or set session variables
    req.session.user = user; // Set the user in the session
    res.status(200).render("user/home");
  } catch (error) {
    console.error("Error logging in with Google:", error);
    res.status(500).redirect("/login");
  }
};

const failureGooglelogin = (req, res) => {
  res.status(500).send("Error logging in with Google");
};



// FORGOT PASSWORD -- STARTS FROM HERE

// FORGOT PASSWORD PAGE DISPLAY
let forgotGetPage = async (req, res) => {
  try {
    res.render("user/forgotemail");
  } catch (error) {
    res.status(404).send("page not found");
  }
};



////////////////////////////////////////////////
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: 'smtp.gmail.com',
   port: 465,
  auth: {
    user: "watchvista6@gmail.com",
    pass: "capvhkkfrmhrjeuy",
  },
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: "watchvista6@gmail.com",
    to: email,
    subject: "Reset Your Password",
    text: `Your OTP to reset your password is: ${otp}`,
  };


  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
////////////////////////////////////////////


// FORGOT EMAIL POST + OTP GENERATION AND MAIL SEND
let forgotEmailPostPage = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiration = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
    await user.save();

    await sendOtpEmail(email, otp);

    res.render("user/forgototp",{email})
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// RESET PASSWORD
let resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || Date.now() > user.otpExpiration) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const bcryptedNewPassword = await bcrypt.hash(newPassword, 10)
    // Reset password
    user.password = bcryptedNewPassword;
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();
    console.log("password resetted");

  
    res.status(200).render("user/login");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server Error" });
  }
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
  successGoogleLogin,
  failureGooglelogin,
  forgotGetPage,
  forgotEmailPostPage,
  resetPassword,
};

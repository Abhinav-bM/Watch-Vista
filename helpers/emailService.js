const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const sendOtpEmail = async (email, message) => {
  const mailOptions = {
    from: "watchvista6@gmail.com",
    to: email,
    subject: "WatchVista",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendOtpEmail };

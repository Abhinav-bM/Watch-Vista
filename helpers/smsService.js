const springedge = require("springedge");
require("dotenv").config();

const apiKey = process.env.SPRING_EDGE_API;

function sendOTP(phoneNumber, otp) {
  const message = `Hello ${otp}, This is a test message from spring edge`;

  const params = {
    sender: "SEDEMO",
    apikey: apiKey,
    to: [`${phoneNumber}`],
    message: message,
    format: "json",
  };

  springedge.messages.send(params, 5000, function (err, response) {
    if (err) {
      return console.log(err);
    }
    console.log(response);
  });
}

module.exports = { sendOTP };
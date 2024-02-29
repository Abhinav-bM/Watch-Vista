// const speakeasy = require('speakeasy');
// const { Vonage } = require('@vonage/server-sdk');

// // INITIALIZE VONAGE
// const vonage = new Vonage({
//   apiKey: "1cdedad8",
//   apiSecret: "Watchvista@123"
// });

// // SECRET GENERATION
// const generateSecret = () => {
//   return speakeasy.generateSecret();
// };

// // SEND SMS WITH NEXMO
// const sendSMS = (phoneNumber, message) => {
//   vonage.messages.send('Vonage', phoneNumber, message, (err, responseData) => {
//     if (err) {
//       console.error('Nexmo SMS Error:', err);
//     } else {
//       console.log('Nexmo SMS Response:', responseData);
//     }
//   });
// };

// // VERIFY TOTP
// const verifyTOTP = (secret, token) => {
//   return speakeasy.totp.verify({
//     secret: secret,
//     encoding: 'base32',
//     token: token,
//     window: 1
//   });
// };

// module.exports = { generateSecret, sendSMS, verifyTOTP };

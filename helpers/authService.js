const speakeasy = require('speakeasy');
const Nexmo = require('nexmo');

// INITIALIZE NEXMO WITH API KEY AND SECRET
const nexmo = new Nexmo({
  apiKey: '',
  apiSecret: ''
});

// SECRET GENERATION
const generateSecret = () => {
  return speakeasy.generateSecret();
};

// SEND SMS WITH NEXMO
const sendSMS = (phoneNumber, message) => {
  nexmo.message.sendSms('YOUR_NEXMO_VIRTUAL_NUMBER', phoneNumber, message, (err, responseData) => {
    if (err) {
      console.error('Nexmo SMS Error:', err);
    } else {
      console.log('Nexmo SMS Response:', responseData);
    }
  });
};

// VERIFY TOTP
const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1
  });
};

module.exports = { generateSecret, sendSMS, verifyTOTP };

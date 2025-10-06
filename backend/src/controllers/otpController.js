const OTP = require('../models/OTP');
const mailSender = require('../utils/mailSender');
const emailTemplate = require('../templates/emailVerificationTemplate');

exports.generateOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp });

    await mailSender(email, 'Verification Email', emailTemplate(otp));

    return res.json({ message: 'OTP sent to email.' });
  } catch (error) {
    return next(error);
  }
};

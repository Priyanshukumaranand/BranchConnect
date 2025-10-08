const mailSender = require('./mailSender');
const passwordResetOtpTemplate = require('../templates/passwordResetOtpTemplate');

module.exports = async function sendPasswordResetEmail(email, otp) {
  await mailSender(email, 'Password Reset OTP', passwordResetOtpTemplate(otp));
};

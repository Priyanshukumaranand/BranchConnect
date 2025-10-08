const OTP = require('../models/OTP');
const mailSender = require('../utils/mailSender');
const emailVerificationTemplate = require('../templates/emailVerificationTemplate');
const passwordResetOtpTemplate = require('../templates/passwordResetOtpTemplate');

const OTP_PURPOSES = new Set(['signup', 'password-reset', 'general']);

const resolvePurpose = (value) => {
  if (!value) {
    return 'signup';
  }

  const normalized = String(value).toLowerCase().trim();
  if (OTP_PURPOSES.has(normalized)) {
    return normalized;
  }

  return 'general';
};

const getEmailContent = (purpose) => {
  if (purpose === 'password-reset') {
    return {
      subject: 'CE Bootcamp Password Reset OTP',
      template: passwordResetOtpTemplate
    };
  }

  return {
    subject: 'CE Bootcamp Verification Code',
    template: emailVerificationTemplate
  };
};

exports.generateOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const resolvedPurpose = resolvePurpose(purpose);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ email, purpose: resolvedPurpose });
    await OTP.create({ email, otp, purpose: resolvedPurpose });

    const { subject, template } = getEmailContent(resolvedPurpose);
    await mailSender(email, subject, template(otp));

    return res.json({ message: 'OTP sent to email.', purpose: resolvedPurpose });
  } catch (error) {
    return next(error);
  }
};

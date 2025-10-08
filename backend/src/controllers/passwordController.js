const User = require('../models/User');
const OTP = require('../models/OTP');
const sendPasswordResetEmail = require('../utils/sendPasswordResetEmail');
const { isInstituteEmail, normaliseInstituteEmail } = require('../utils/college');

const PASSWORD_RESET_PURPOSE = 'password-reset';

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = normaliseInstituteEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!isInstituteEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Use your institute email (e.g. b522046@iiit-bh.ac.in).' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const otp = generateOtp();
    await OTP.deleteMany({ email: normalizedEmail, purpose: PASSWORD_RESET_PURPOSE });
    await OTP.create({ email: normalizedEmail, otp, purpose: PASSWORD_RESET_PURPOSE });

    await sendPasswordResetEmail(normalizedEmail, otp);

    return res.json({ message: 'OTP sent to email.' });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    const normalizedEmail = normaliseInstituteEmail(email);
    const normalizedOtp = String(otp).trim();

    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (!isInstituteEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Use your institute email (e.g. b522046@iiit-bh.ac.in).' });
    }

    if (!/^[0-9]{6}$/.test(normalizedOtp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const recentOtp = await OTP.findOne({ email: normalizedEmail, purpose: PASSWORD_RESET_PURPOSE }).sort({ createdAt: -1 });

    if (!recentOtp || recentOtp.otp !== normalizedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    user.password = password;
    await user.save();

    await OTP.deleteMany({ email: normalizedEmail, purpose: PASSWORD_RESET_PURPOSE });

    return res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    return next(error);
  }
};

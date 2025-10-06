const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const sendPasswordResetEmail = require('../utils/sendPasswordResetEmail');

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const token = generateToken({ email }, { expiresIn: '1h' });
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    await sendPasswordResetEmail(email, token);

    return res.json({ message: 'Password reset instructions sent.' });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    return next(error);
  }
};

const passport = require('passport');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken } = require('../utils/jwt');

function sanitizeUser(user) {
  if (!user) return null;
  const { password, img, ...safe } = user.toObject({ getters: true });
  if (img && img.data) {
    safe.hasAvatar = true;
  }
  return safe;
}

exports.signup = async (req, res, next) => {
  try {
    const { name, collegeId, email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({ error: 'Email, password, and OTP are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!recentOtp || recentOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const user = await User.create({
      name,
      collegeId,
      email,
      password
    });

    await OTP.deleteMany({ email });

    return res.status(201).json({
      message: 'Account created successfully. Please sign in.',
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      message: 'Signed in successfully.',
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  req.logout?.(() => {});
  res.json({ message: 'Signed out.' });
};

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL || '/',
    session: true
  }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect((process.env.FRONTEND_URL || '/') + '?error=google-auth');
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      const token = generateToken({ id: user.id, email: user.email });
      res.cookie('jwt', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect(process.env.FRONTEND_URL || '/');
    });
  })(req, res, next);
};

exports.me = (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: req.currentUser });
};

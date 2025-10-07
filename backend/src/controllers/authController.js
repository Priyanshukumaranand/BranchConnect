const passport = require('passport');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken } = require('../utils/jwt');
const { sanitizeUser } = require('../utils/sanitizeUser');

const getFrontendBaseUrl = () => {
  if (!process.env.FRONTEND_URL) {
    return 'http://localhost:3000';
  }

  const origins = process.env.FRONTEND_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins[0] || 'http://localhost:3000';
};

const buildFrontendUrl = (params = {}) => {
  const base = getFrontendBaseUrl();

  try {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  } catch (error) {
    const queryString = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    if (!queryString) {
      return base;
    }

    return `${base}${base.includes('?') ? '&' : '?'}${queryString}`;
  }
};

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
      user: sanitizeUser(user, { includeImageData: true })
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

    await new Promise((resolve, reject) => {
      req.logIn(user, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const token = generateToken({ id: user.id, email: user.email });
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      message: 'Signed in successfully.',
      user: sanitizeUser(user, { includeImageData: true })
    });
  } catch (error) {
    return next(error);
  }
};

const resolveCookieSameSite = () => {
  const allowed = new Set(['lax', 'strict', 'none']);
  const raw = (process.env.COOKIE_SAMESITE || '').toLowerCase();
  const isProduction = process.env.NODE_ENV === 'production';

  if (allowed.has(raw)) {
    if (raw === 'none' && !isProduction) {
      return 'lax';
    }
    return raw;
  }

  return isProduction ? 'none' : 'lax';
};

const cookieOptions = {
  httpOnly: true,
  sameSite: resolveCookieSameSite(),
  secure: process.env.NODE_ENV === 'production'
};

exports.logout = (req, res, next) => {
  const sendSignedOut = () => {
    res.clearCookie('jwt', { ...cookieOptions, path: '/' });
    res.clearCookie('cebootcamp.sid', { ...cookieOptions, path: '/' });
    res.status(200).json({ message: 'Signed out.' });
  };

  const destroySession = () => {
    if (req.session) {
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return next(sessionErr);
        }
        return sendSignedOut();
      });
    } else {
      sendSignedOut();
    }
  };

  if (typeof req.logout === 'function') {
    req.logout((logoutErr) => {
      if (logoutErr) {
        return next(logoutErr);
      }
      return destroySession();
    });
  } else {
    destroySession();
  }
};

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleAuthCallback = (req, res, next) => {
  const frontendBaseUrl = getFrontendBaseUrl();
  const failureRedirect = buildFrontendUrl({ error: 'google-auth' });

  passport.authenticate('google', {
    failureRedirect,
    session: true
  }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(failureRedirect);
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

      return res.redirect(frontendBaseUrl);
    });
  })(req, res, next);
};

exports.me = (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: sanitizeUser(req.currentUser, { includeImageData: true }) });
};

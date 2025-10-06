const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

async function attachUser(req, res, next) {
  try {
    const token = req.cookies?.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) {
      return next();
    }

    const user = await User.findOne({ email: decoded.email }).select('-password');
    if (user) {
      req.currentUser = user;
    }

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next();
    }
    return next(error);
  }
}

function requireAuth(req, res, next) {
  if (req.currentUser) {
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

module.exports = {
  attachUser,
  requireAuth
};

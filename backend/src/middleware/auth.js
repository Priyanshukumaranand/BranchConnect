const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

async function attachUser(req, res, next) {
  try {
    if (req.user && !req.currentUser) {
      req.currentUser = req.user;
      return next();
    }

    if (!req.currentUser && req.session?.passport?.user) {
      const sessionUserId = req.session.passport.user;
      const sessionUser = await User.findById(sessionUserId).select('-password');
      if (sessionUser) {
        req.currentUser = sessionUser;
        return next();
      }
    }

    const token = req.cookies?.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next();
    }

    let user = null;

    if (decoded.id) {
      user = await User.findById(decoded.id).select('-password');
    } else if (decoded.email) {
      user = await User.findOne({ email: decoded.email }).select('-password');
    }

    if (!user) {
      return next();
    }

    req.currentUser = user;

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

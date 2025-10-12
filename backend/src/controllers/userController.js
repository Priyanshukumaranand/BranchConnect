const User = require('../models/User');
const { sanitizeUser } = require('../utils/sanitizeUser');
const { toBuffer, hasImageData } = require('../utils/image');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getMe = (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: sanitizeUser(req.currentUser, { includeImageData: true }) });
};

exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const incomingCollegeId = typeof req.body.collegeId === 'string'
      ? req.body.collegeId.trim()
      : '';

    // Helper to safely assign string values
    const safeString = v => typeof v === 'string' ? v : undefined;
    const updates = {
      name: safeString(req.body.name),
      place: safeString(req.body.place),
      about: safeString(req.body.about),
      instagram: safeString(req.body.instagram),
      linkedin: safeString(req.body.linkedin),
      github: safeString(req.body.github),
      leetcode: safeString(req.body.leetcode),
      codeforces: safeString(req.body.codeforces),
      codechef: safeString(req.body.codechef)
    };

    if (req.currentUser.collegeId) {
      const currentId = req.currentUser.collegeId.trim();
      if (incomingCollegeId && incomingCollegeId.toLowerCase() !== currentId.toLowerCase()) {
  return res.status(400).json({ error: 'Roll ID cannot be changed. Please contact the Branch Connect team for assistance.' });
      }
    } else if (incomingCollegeId) {
      updates.collegeId = incomingCollegeId;
    }

    if (req.file) {
      updates.img = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

  const user = await User.findByIdAndUpdate(req.currentUser.id, updates, {
      new: true
    }).select('-password');

  return res.json({ message: 'Profile updated.', user: sanitizeUser(user, { includeImageData: true }) });
  } catch (error) {
    return next(error);
  }
};

exports.getByEmail = async (req, res, next) => {
  try {
    const rawEmail = (req.query.email || req.params.email || '').trim();

    if (!rawEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailRegex = new RegExp(`^${escapeRegex(rawEmail)}$`, 'i');
    const user = await User.findOne({ email: emailRegex }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

  return res.json({ user: sanitizeUser(user, { includeImageData: true }) });
  } catch (error) {
    return next(error);
  }
};

exports.getAvatarByEmail = async (req, res, next) => {
  try {
    const rawEmail = (req.query.email || req.params.email || '').trim();

    if (!rawEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailRegex = new RegExp(`^${escapeRegex(rawEmail)}$`, 'i');
    const user = await User.findOne({ email: emailRegex }).select('img updatedAt');

    if (!user || !hasImageData(user.img)) {
      return res.status(404).json({ error: 'Profile image not found.' });
    }

    const buffer = toBuffer(user.img.data);
    if (!buffer) {
      return res.status(404).json({ error: 'Profile image not found.' });
    }

    res.setHeader('Content-Type', user.img.contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (user.updatedAt) {
      res.setHeader('Last-Modified', user.updatedAt.toUTCString());
    }

    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    return res.json({ users: users.map((user) => sanitizeUser(user, { includeImageData: true })) });
  } catch (error) {
    return next(error);
  }
};

exports.getAvatar = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User id is required.' });
    }

    const user = await User.findById(userId).select('img updatedAt');

    if (!user || !hasImageData(user.img)) {
      return res.status(404).json({ error: 'Profile image not found.' });
    }

    const buffer = toBuffer(user.img.data);
    if (!buffer) {
      return res.status(404).json({ error: 'Profile image not found.' });
    }

    res.setHeader('Content-Type', user.img.contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (user.updatedAt) {
      res.setHeader('Last-Modified', user.updatedAt.toUTCString());
    }

    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User id is required.' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: sanitizeUser(user, { includeImageData: true }) });
  } catch (error) {
    return next(error);
  }
};

const User = require('../models/User');
const { sanitizeUser } = require('../utils/sanitizeUser');
const { toBuffer, hasImageData } = require('../utils/image');

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

    const updates = {
      name: req.body.name,
      collegeId: req.body.collegeId,
      place: req.body.place,
      about: req.body.about,
      instagram: req.body.instagram,
      linkedin: req.body.linkedin,
      github: req.body.github
    };

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

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    return res.json({ users: users.map((user) => sanitizeUser(user)) });
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

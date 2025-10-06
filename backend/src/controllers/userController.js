const User = require('../models/User');

exports.getMe = (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: req.currentUser });
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

    return res.json({ message: 'Profile updated.', user });
  } catch (error) {
    return next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password -img.data');
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

const User = require('../models/User');

exports.listBatches = async (req, res, next) => {
  try {
    const { year } = req.query;
    const query = {};

    if (year) {
      query.collegeId = { $regex: year, $options: 'i' };
    }

    const users = await User.find(query).select('-password -img.data').sort('collegeId');

    return res.json({
      total: users.length,
      users
    });
  } catch (error) {
    return next(error);
  }
};

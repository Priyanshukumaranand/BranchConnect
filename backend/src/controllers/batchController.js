const User = require('../models/User');

const deriveCollegePrefixFromYear = (value) => {
  if (!value) return null;

  const numericYear = Number.parseInt(value, 10);
  if (Number.isNaN(numericYear)) {
    return null;
  }

  const offset = numericYear - 1500;
  if (offset <= 0) {
    return null;
  }

  return `b${offset}`;
};

const buildBatchQuery = (year) => {
  const query = {};

  if (!year || year === 'all') {
    return query;
  }

  const prefix = deriveCollegePrefixFromYear(year);

  if (prefix) {
    query.collegeId = { $regex: `^${prefix}`, $options: 'i' };
    return query;
  }

  query.$or = [
    { collegeId: { $regex: year, $options: 'i' } },
    { email: { $regex: year, $options: 'i' } }
  ];

  return query;
};

const toBatchYear = (collegeId) => {
  if (!collegeId || typeof collegeId !== 'string') return null;

  const match = collegeId.toLowerCase().match(/^b(\d{3})/);
  if (!match) return null;

  const prefixNumber = Number.parseInt(match[1], 10);
  if (Number.isNaN(prefixNumber)) return null;

  return 1500 + prefixNumber;
};

const toDataUrl = (image = {}) => {
  const { data, contentType } = image;
  if (!data) return null;

  let buffer;
  if (Buffer.isBuffer(data)) {
    buffer = data;
  } else if (typeof data === 'string') {
    buffer = Buffer.from(data, 'base64');
  } else if (data?.type === 'Buffer' && Array.isArray(data.data)) {
    buffer = Buffer.from(data.data);
  } else {
    return null;
  }

  const mime = contentType || 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

const sanitizeUser = (user) => {
  const batchYear = user.batchYear || toBatchYear(user.collegeId);
  const socials = {
    instagram: user.instagram,
    github: user.github,
    linkedin: user.linkedin,
    email: user.email
  };

  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    collegeId: user.collegeId,
    batchYear,
    about: user.about,
    place: user.place,
    secret: user.secret,
    socials,
    image: toDataUrl(user.img),
    createdAt: user.created
  };
};

exports.listBatches = async (req, res, next) => {
  try {
    const { year } = req.query;
    const query = buildBatchQuery(year);

    const users = await User.find(query)
      .select('-password')
      .sort('email')
      .lean({ getters: true });

    return res.json({
      total: users.length,
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    return next(error);
  }
};

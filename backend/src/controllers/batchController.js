const User = require('../models/User');
const { imageToDataUrl, hasImageData } = require('../utils/image');

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

const buildAvatar = (user) => {
  const id = user._id?.toString() || user.id;
  if (!hasImageData(user.img)) {
    return {
      hasAvatar: false,
      image: null,
      avatarPath: null,
      avatarContentType: null
    };
  }

  return {
    hasAvatar: true,
    image: imageToDataUrl(user.img),
    avatarPath: id ? `/users/${id}/avatar` : null,
    avatarContentType: user.img?.contentType || null
  };
};

const sanitizeUser = (user) => {
  const batchYear = user.batchYear || toBatchYear(user.collegeId);
  const socials = {
    instagram: user.instagram,
    github: user.github,
    linkedin: user.linkedin,
    email: user.email
  };

  const avatar = buildAvatar(user);

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
    image: avatar.image,
    hasAvatar: avatar.hasAvatar,
    avatarPath: avatar.avatarPath,
    avatarContentType: avatar.avatarContentType,
    createdAt: user.created
  };
};

exports.listBatches = async (req, res, next) => {
  try {
    const { year } = req.query;
    const query = buildBatchQuery(year);

    const limitParam = Number.parseInt(req.query.limit, 10);
    const pageParam = Number.parseInt(req.query.page, 10);

    const pageSize = Number.isNaN(limitParam)
      ? 12
      : Math.min(Math.max(limitParam, 1), 60);
    const page = Number.isNaN(pageParam)
      ? 1
      : Math.max(pageParam, 1);

    const skip = (page - 1) * pageSize;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort('email')
        .skip(skip)
        .limit(pageSize)
        .lean({ getters: true })
    ]);

    const hasMore = skip + users.length < total;
    const nextPage = hasMore ? page + 1 : null;

    return res.json({
      total,
      page,
      pageSize,
      hasMore,
      nextPage,
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    return next(error);
  }
};

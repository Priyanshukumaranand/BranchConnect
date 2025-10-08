const User = require('../models/User');
const { imageToDataUrl, hasImageData } = require('../utils/image');

const BRANCH_DEFINITIONS = [
  { code: '1', key: 'cse', short: 'CSE', label: 'Computer Science & Engineering' },
  { code: '2', key: 'ece', short: 'ECE', label: 'Electronics & Communication Engineering' },
  { code: '3', key: 'eee', short: 'EEE', label: 'Electrical & Electronics Engineering' },
  { code: '4', key: 'it', short: 'IT', label: 'Information Technology' },
  { code: '5', key: 'ce', short: 'CE', label: 'Civil Engineering' }
];

const BRANCH_CODE_LOOKUP = BRANCH_DEFINITIONS.reduce((acc, branch) => {
  acc[branch.code] = branch;
  return acc;
}, {});

const BRANCH_ALIAS_LOOKUP = BRANCH_DEFINITIONS.reduce((acc, branch) => {
  const aliases = new Set([
    branch.key,
    branch.short,
    branch.code,
    `b${branch.code}`,
    branch.label.toLowerCase(),
    branch.label.replace(/[^a-z]/gi, '').toLowerCase()
  ]);

  aliases.forEach((alias) => {
    if (alias) {
      acc[alias.toString().trim().toLowerCase()] = branch.code;
    }
  });

  return acc;
}, {});

const normalizeBranchCodes = (value) => {
  if (!value) {
    return [];
  }

  const rawTokens = Array.isArray(value)
    ? value
    : value.toString().split(/[|,/\\\s]+/);

  const codes = new Set();

  rawTokens
    .map((token) => token && token.toString().trim().toLowerCase())
    .filter(Boolean)
    .forEach((token) => {
      if (BRANCH_ALIAS_LOOKUP[token]) {
        codes.add(BRANCH_ALIAS_LOOKUP[token]);
        return;
      }

      const digitMatch = token.match(/^b?(\d)$/);
      if (digitMatch && BRANCH_CODE_LOOKUP[digitMatch[1]]) {
        codes.add(digitMatch[1]);
      }
    });

  return Array.from(codes);
};

const deriveYearSuffix = (value) => {
  if (!value || value === 'all') {
    return null;
  }

  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }

  const numericYear = Number.parseInt(trimmed, 10);
  if (Number.isNaN(numericYear)) {
    return null;
  }

  if (trimmed.length === 2) {
    return trimmed.padStart(2, '0');
  }

  if (trimmed.length === 4) {
    if (numericYear < 1900 || numericYear > 2100) {
      return null;
    }
    return trimmed.slice(2);
  }

  return null;
};

const buildBatchQuery = ({ branch, year }) => {
  const branchCodes = normalizeBranchCodes(branch);
  const yearSuffix = deriveYearSuffix(year);

  if (!yearSuffix && (!branchCodes || branchCodes.length === 0)) {
    if (!year || year === 'all') {
      return {};
    }

    return {
      $or: [
        { collegeId: { $regex: year, $options: 'i' } },
        { email: { $regex: year, $options: 'i' } }
      ]
    };
  }

  const hasCustomBranch = Array.isArray(branchCodes) && branchCodes.length > 0;
  const branchPart = hasCustomBranch
    ? (branchCodes.length === 1 ? branchCodes[0] : `[${branchCodes.join('')}]`)
    : '\\d';

  const yearPart = yearSuffix || '';

  return {
    collegeId: {
      $regex: `^b${branchPart}${yearPart}`,
      $options: 'i'
    }
  };
};

const toBatchYear = (collegeId) => {
  if (!collegeId || typeof collegeId !== 'string') return null;

  const match = collegeId.toLowerCase().match(/^b\d(\d{2})/);
  if (!match) return null;

  const yearDigits = Number.parseInt(match[1], 10);
  if (Number.isNaN(yearDigits)) return null;

  return 2000 + yearDigits;
};

const toBranchDetails = (collegeId) => {
  if (!collegeId || typeof collegeId !== 'string') {
    return null;
  }

  const match = collegeId.toLowerCase().match(/^b(\d)/);
  if (!match) {
    return null;
  }

  const code = match[1];
  const details = BRANCH_CODE_LOOKUP[code];

  if (!details) {
    return {
      code,
      key: null,
      short: `B${code}`,
      label: `Branch ${code}`
    };
  }

  return {
    code: details.code,
    key: details.key,
    short: details.short,
    label: details.label
  };
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
  const branch = toBranchDetails(user.collegeId);
  const socials = {
    instagram: user.instagram,
    github: user.github,
    linkedin: user.linkedin,
    leetcode: user.leetcode,
    codeforces: user.codeforces,
    codechef: user.codechef,
    email: user.email
  };

  const avatar = buildAvatar(user);

  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    collegeId: user.collegeId,
    batchYear,
  branch,
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
    const { year, branch } = req.query;
    const query = buildBatchQuery({ year, branch });

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

const User = require('../models/User');
const { imageToDataUrl, hasImageData } = require('../utils/image');
const BatchIndex = require('../models/BatchIndex');
const { getJson, setJson } = require('../config/redis');

const BATCH_META_CACHE_KEY = 'batch:meta:global';
const BATCH_META_CACHE_TTL_SECONDS = (() => {
  const parsed = Number.parseInt(process.env.BATCH_META_CACHE_TTL_SECONDS, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 600; // default 10 minutes
  return parsed;
})();
const BATCH_LIST_CACHE_TTL_SECONDS = (() => {
  const parsed = Number.parseInt(process.env.BATCH_LIST_CACHE_TTL_SECONDS, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 180; // default 3 minutes
  return parsed;
})();

const BRANCH_DEFINITIONS = [
  { code: '1', key: 'cse', short: 'CSE', label: 'Computer Science & Engineering' },
  { code: '2', key: 'ece', short: 'ECE', label: 'Electronics & Communication Engineering' },
  { code: '3', key: 'eee', short: 'EEE', label: 'Electrical & Electronics Engineering' },
  { code: '4', key: 'it', short: 'IT', label: 'Information Technology' },
  { code: '5', key: 'ce', short: 'CE', label: 'Civil Engineering' }
];

const extractEmailLocalPart = (email) => {
  if (!email || typeof email !== 'string') return null;
  const [local] = email.split('@');
  return local ? local.trim() : null;
};

const resolveIdSource = (collegeId, email) => {
  if (collegeId && typeof collegeId === 'string' && collegeId.trim()) {
    return collegeId.trim();
  }

  const localFromEmail = extractEmailLocalPart(email);
  if (localFromEmail) {
    return localFromEmail;
  }

  return null;
};

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

const deriveNumericYear = (value) => {
  if (!value || value === 'all') return null;
  const trimmed = value.toString().trim();
  if (!trimmed) return null;
  const numericYear = Number.parseInt(trimmed, 10);
  if (Number.isNaN(numericYear)) return null;
  if (trimmed.length === 2) {
    return 2000 + numericYear;
  }
  if (trimmed.length === 4) {
    if (numericYear < 1900 || numericYear > 2100) return null;
    return numericYear;
  }
  return null;
};

const buildBatchListCacheKey = ({
  year,
  branch,
  page,
  pageSize,
  includeImageData,
  host,
  metaUpdatedAt
}) => {
  const parts = [
    'batch:list',
    `y:${year && year.toString().trim() ? year.toString().trim() : 'all'}`,
    `b:${branch || 'all'}`,
    `p:${page}`,
    `l:${pageSize}`,
    `img:${includeImageData ? '1' : '0'}`
  ];

  if (metaUpdatedAt) {
    const ts = new Date(metaUpdatedAt).getTime();
    if (Number.isFinite(ts)) {
      parts.push(`u:${ts}`);
    }
  }

  if (host) {
    parts.push(`h:${host.toString().toLowerCase()}`);
  }

  return parts.join('|');
};

const buildBatchQuery = ({ branch, year }) => {
  const branchCodes = normalizeBranchCodes(branch);
  const yearSuffix = deriveYearSuffix(year);
  const numericYear = deriveNumericYear(year);

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
  const conditions = [];

  const anchoredPattern = new RegExp(`^b${branchPart}${yearPart}`);

  const idRegexCondition = (field) => ({
    [field]: {
      $regex: anchoredPattern
    }
  });

  conditions.push(idRegexCondition('collegeId'));
  conditions.push(idRegexCondition('email'));

  if (numericYear) {
    if (hasCustomBranch) {
      conditions.push({
        $and: [
          { batchYear: numericYear },
          { $or: [idRegexCondition('collegeId'), idRegexCondition('email')] }
        ]
      });
    } else {
      conditions.push({ batchYear: numericYear });
    }
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $or: conditions };
};

const toBatchYear = (collegeId, email) => {
  const idValue = resolveIdSource(collegeId, email);
  if (!idValue || typeof idValue !== 'string') return null;

  const match = idValue.toLowerCase().match(/^b\d(\d{2})/);
  if (!match) return null;

  const yearDigits = Number.parseInt(match[1], 10);
  if (Number.isNaN(yearDigits)) return null;

  return 2000 + yearDigits;
};

const toBranchDetails = (collegeId, email) => {
  const idValue = resolveIdSource(collegeId, email);
  if (!idValue || typeof idValue !== 'string') {
    return null;
  }

  const match = idValue.toLowerCase().match(/^b(\d)/);
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

const deriveYearFromId = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.toLowerCase().match(/^b\d(\d{2})/);
  if (!match) return null;
  const digits = Number.parseInt(match[1], 10);
  if (Number.isNaN(digits)) return null;
  return 2000 + digits;
};

const ensureBatchIndex = async (maxAgeMs = 10 * 60 * 1000) => {
  const existing = await BatchIndex.findById('global').lean();
  const now = Date.now();
  const isFresh = existing?.updatedAt && now - new Date(existing.updatedAt).getTime() < maxAgeMs;
  if (isFresh) {
    return existing;
  }

  const branchAgg = await User.aggregate([
    {
      $project: {
        _idSource: {
          $toLower: {
            $ifNull: [
              '$collegeId',
              { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] }
            ]
          }
        },
        batchYear: '$batchYear'
      }
    },
    {
      $project: {
        idSource: '$_idSource',
        code: { $substrBytes: ['$_idSource', 1, 1] },
        yearDigits: { $substrBytes: ['$_idSource', 2, 2] },
        batchYear: 1
      }
    },
    {
      $match: {
        idSource: { $exists: true, $ne: null },
        code: { $regex: '^[0-9]$' },
        yearDigits: { $regex: '^\\d{2}$' }
      }
    },
    {
      $group: {
        _id: '$code',
        count: { $sum: 1 },
        years: { $addToSet: '$yearDigits' },
        explicitYears: { $addToSet: '$batchYear' }
      }
    }
  ]);

  const branchMap = new Map();
  const yearCounts = new Map();
  let totalUsers = 0;

  branchAgg.forEach((entry) => {
    totalUsers += entry.count || 0;

    const branch = toBranchDetails(`b${entry._id}00`);
    if (branch) {
      const key = (branch.key || branch.short || branch.code || '').toString().toLowerCase();
      branchMap.set(key, {
        key,
        short: branch.short || branch.label || key || 'Branch',
        label: branch.label || branch.short || key || 'Branch',
        count: entry.count
      });
    }

    const years = new Set();
    (entry.years || []).forEach((yd) => {
      const digits = Number.parseInt(yd, 10);
      if (!Number.isNaN(digits)) {
        years.add(2000 + digits);
      }
    });
    (entry.explicitYears || []).forEach((year) => {
      if (year) years.add(year);
    });

    years.forEach((year) => {
      const prev = yearCounts.get(year) || 0;
      yearCounts.set(year, prev + entry.count);
    });
  });

  const payload = {
    _id: 'global',
    totalUsers,
    years: Array.from(yearCounts.keys()).sort((a, b) => b - a),
    batches: Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year),
    branches: Array.from(branchMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
    updatedAt: new Date()
  };

  await BatchIndex.findOneAndUpdate({ _id: 'global' }, payload, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  return payload;
};

const buildAvatar = (user, { includeImageData = false, baseUrl = null } = {}) => {
  const id = user._id?.toString() || user.id;
  if (!hasImageData(user.img)) {
    return {
      hasAvatar: false,
      avatarPath: null,
      avatarContentType: null,
      avatarUrl: null,
      image: null
    };
  }

  const avatarPath = id ? `/users/${id}/avatar` : null;
  let avatarUrl = null;

  if (avatarPath && baseUrl) {
    try {
      const resolved = new URL(avatarPath, baseUrl);
      avatarUrl = resolved.toString();
    } catch (error) {
      avatarUrl = null;
    }
  }

  return {
    hasAvatar: true,
    image: includeImageData ? imageToDataUrl(user.img) : null,
    avatarPath,
    avatarContentType: user.img?.contentType || null,
    avatarUrl
  };
};

const sanitizeUser = (user, options = {}) => {
  const { includeImageData = false, baseUrl = null } = options;
  const idSource = resolveIdSource(user.collegeId, user.email);
  const batchYear = user.batchYear || toBatchYear(idSource);
  const branch = toBranchDetails(idSource);
  const socials = {
    instagram: user.instagram,
    github: user.github,
    linkedin: user.linkedin,
    leetcode: user.leetcode,
    codeforces: user.codeforces,
    codechef: user.codechef,
    email: user.email
  };

  const avatar = buildAvatar(user, { includeImageData, baseUrl });

  const sanitized = {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    collegeId: user.collegeId || idSource,
    batchYear,
    branch,
    about: user.about,
    place: user.place,
    secret: user.secret,
    socials,
    hasAvatar: avatar.hasAvatar,
    avatarPath: avatar.avatarPath,
    avatarContentType: avatar.avatarContentType,
    avatarUrl: avatar.avatarUrl,
    createdAt: user.created
  };

  if (includeImageData && avatar.image) {
    sanitized.image = avatar.image;
  }

  return sanitized;
};

exports.listBatchesMeta = async (req, res, next) => {
  try {
    let batchIndex = null;

    try {
      batchIndex = await getJson(BATCH_META_CACHE_KEY);
    } catch (cacheError) {
      // cache errors are non-fatal; fall back to Mongo aggregation
    }

    if (!batchIndex) {
      batchIndex = await ensureBatchIndex();
      try {
        await setJson(BATCH_META_CACHE_KEY, batchIndex, BATCH_META_CACHE_TTL_SECONDS);
      } catch (cacheWriteError) {
        // ignore cache write failures to avoid blocking the request path
      }
    }

    return res.json({
      total: batchIndex?.totalUsers ?? 0,
      meta: {
        years: batchIndex?.years || [],
        branches: batchIndex?.branches || [],
        batches: batchIndex?.batches || [],
        updatedAt: batchIndex?.updatedAt || null
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.listBatches = async (req, res, next) => {
  try {
    const { year, branch } = req.query;

    let batchIndex = null;

    try {
      batchIndex = await getJson(BATCH_META_CACHE_KEY);
    } catch (cacheError) {
      // cache errors are non-fatal; fall back to Mongo aggregation
    }

    if (!batchIndex) {
      batchIndex = await ensureBatchIndex();
      try {
        await setJson(BATCH_META_CACHE_KEY, batchIndex, BATCH_META_CACHE_TTL_SECONDS);
      } catch (cacheWriteError) {
        // ignore cache write failures to avoid blocking the request path
      }
    }

    // Temporarily ignore branch filter to avoid branch-related bugs
    const query = buildBatchQuery({ year, branch: null });

    const limitParam = Number.parseInt(req.query.limit, 10);
    const pageParam = Number.parseInt(req.query.page, 10);

    const pageSize = Number.isNaN(limitParam)
      ? 12
      : Math.min(Math.max(limitParam, 1), 60);
    const page = Number.isNaN(pageParam)
      ? 1
      : Math.max(pageParam, 1);

    const skip = (page - 1) * pageSize;

    const includeImageData = ['1', 'true', 'yes', 'inline'].includes(String(req.query.includeImages || req.query.includeImage || req.query.images).toLowerCase());
    const protocol = req.protocol || 'http';
    const host = req.get ? req.get('host') : null;
    const baseUrl = host ? `${protocol}://${host}` : null;

    const cacheEligible = !includeImageData && BATCH_LIST_CACHE_TTL_SECONDS > 0;
    const cacheKey = cacheEligible
      ? buildBatchListCacheKey({
          year,
          branch: null,
          page,
          pageSize,
          includeImageData,
          host,
          metaUpdatedAt: batchIndex?.updatedAt
        })
      : null;

    if (cacheKey) {
      try {
        const cached = await getJson(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      } catch (cacheReadError) {
        // ignore cache read failures
      }
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort('email')
        .skip(skip)
        .limit(pageSize)
        .lean({ getters: true })
    ]);

    const sanitizedUsers = users.map((user) => sanitizeUser(user, { includeImageData, baseUrl }));
    const previewCount = Math.min(12, sanitizedUsers.length);
    const previews = sanitizedUsers.slice(0, previewCount).map((user) => ({
      id: user.id,
      name: user.name,
      image: user.image || user.avatarUrl || null,
      avatarPath: user.avatarPath || null,
      hasAvatar: user.hasAvatar || Boolean(user.image || user.avatarUrl)
    }));

    let hasMore = users.length === pageSize && (skip + users.length) < total;
    if (page > 1 && users.length === 0) {
      hasMore = false;
    }
    const nextPage = hasMore ? page + 1 : null;

    const responsePayload = {
      total,
      page,
      pageSize,
      hasMore,
      nextPage,
      users: sanitizedUsers,
      meta: {
        years: batchIndex?.years || [],
        branches: batchIndex?.branches || [],
        batches: batchIndex?.batches || [],
        updatedAt: batchIndex?.updatedAt || null,
        previews
      }
    };

    if (cacheKey) {
      try {
        await setJson(cacheKey, responsePayload, BATCH_LIST_CACHE_TTL_SECONDS);
      } catch (cacheWriteError) {
        // ignore cache write failures to avoid blocking the request path
      }
    }

    return res.json(responsePayload);
  } catch (error) {
    return next(error);
  }
};

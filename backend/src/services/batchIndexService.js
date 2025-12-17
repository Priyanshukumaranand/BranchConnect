const BatchIndex = require('../models/BatchIndex');
const { deleteKey } = require('../config/redis');

const BATCH_META_CACHE_KEY = 'batch:meta:global';

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

  const local = extractEmailLocalPart(email);
  if (local) {
    return local;
  }

  return null;
};

const BRANCH_CODE_LOOKUP = BRANCH_DEFINITIONS.reduce((acc, branch) => {
  acc[branch.code] = branch;
  return acc;
}, {});

const toBranchDetails = (collegeId, email) => {
  const idValue = resolveIdSource(collegeId, email);
  if (!idValue || typeof idValue !== 'string') return null;
  const match = idValue.toLowerCase().match(/^b(\d)/);
  if (!match) return null;
  const details = BRANCH_CODE_LOOKUP[match[1]];
  if (!details) {
    return {
      code: match[1],
      key: null,
      short: `B${match[1]}`,
      label: `Branch ${match[1]}`
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

const updateBatchIndexForUser = async (user) => {
  if (!user) return null;

  const idSource = resolveIdSource(user.collegeId, user.email);
  const branch = toBranchDetails(idSource);
  const year = user.batchYear || deriveYearFromId(idSource);

  const doc = await BatchIndex.findById('global') || new BatchIndex({ _id: 'global' });

  if (branch) {
    const key = (branch.key || branch.short || branch.code || '').toString().toLowerCase();
    const existing = doc.branches.find((b) => b.key === key);
    if (existing) {
      existing.count = (existing.count || 0) + 1;
      existing.short = existing.short || branch.short || existing.key;
      existing.label = existing.label || branch.label || existing.key;
    } else {
      doc.branches.push({
        key,
        short: branch.short || branch.label || key || 'Branch',
        label: branch.label || branch.short || key || 'Branch',
        count: 1
      });
    }
  }

  if (year) {
    if (!doc.years.includes(year)) {
      doc.years.push(year);
    }
    const existingYear = doc.batches.find((entry) => entry.year === year);
    if (existingYear) {
      existingYear.count = (existingYear.count || 0) + 1;
    } else {
      doc.batches.push({ year, count: 1 });
    }
  }

  doc.updatedAt = new Date();
  await doc.save();

  try {
    await deleteKey(BATCH_META_CACHE_KEY);
  } catch (cacheError) {
    // Cache invalidation failures should not block user creation
  }

  return doc;
};

module.exports = {
  updateBatchIndexForUser
};

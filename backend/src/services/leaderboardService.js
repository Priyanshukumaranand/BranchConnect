const User = require('../models/User');

const CODEFORCES_API_URL = 'https://codeforces.com/api/user.info';
const LEETCODE_RATING_API_URL = 'https://leetcode-api-faisalshohag.vercel.app';
const LEETCODE_BADGE_API_URL = 'https://leetcode-badge.vercel.app/api/users';
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const LEETCODE_GRAPHQL_ENABLED = process.env.LEETCODE_ENABLE_GRAPHQL === 'true';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REQUEST_TIMEOUT_MS = 8000;

const LEETCODE_CONTEST_QUERY = `
  query userContestRankingInfo($username: String!) {
    userContestRanking(username: $username) {
      rating
      attendedContestsCount
      globalRanking
      topPercentage
    }
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

const providerCache = {
  codeforces: new Map(), // handle -> { fetchedAt, data }
  leetcode: new Map() // username -> { fetchedAt, data }
};

const titleCase = (value = '') => value
  .toString()
  .toLowerCase()
  .split(/\s+/)
  .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
  .join(' ');

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const parseTopPercentage = (value) => {
  if (value == null) {
    return null;
  }
  const match = /top\s+([\d.]+)%/i.exec(String(value));
  if (!match) {
    return null;
  }
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) ? numeric : null;
};

const isCacheEntryValid = (entry) => {
  if (!entry) return false;
  return (Date.now() - entry.fetchedAt) < CACHE_TTL_MS;
};

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = REQUEST_TIMEOUT_MS, signal, ...rest } = options;
  const controller = new AbortController();
  const abortHandler = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
};

const fetchLeetCodeContestData = async (username, { signal } = {}) => {
  try {
    const response = await fetchWithTimeout(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      signal,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BranchConnectLeaderboardBot/1.0 (+https://branchconnect.example)',
        Accept: 'application/json',
        Referer: 'https://leetcode.com'
      },
      body: JSON.stringify({
        operationName: 'userContestRankingInfo',
        variables: { username },
        query: LEETCODE_CONTEST_QUERY
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    return payload.data ?? null;
  } catch (error) {
    return null;
  }
};

const fetchLeetCodeBadgeData = async (username, { signal } = {}) => {
  try {
    const url = `${LEETCODE_BADGE_API_URL}/${encodeURIComponent(username)}?region=global`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      signal,
      timeout: 5000,
      headers: {
        'User-Agent': 'BranchConnectLeaderboardBot/1.0 (+https://branchconnect.example)',
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || payload.error) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

const extractHandleFromUrl = (rawValue, provider) => {
  if (!rawValue) return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const normalised = trimmed.replace(/\s/g, '');

  if (!/^https?:/i.test(normalised)) {
    return normalised.replace(/^@/, '');
  }

  try {
    const parsed = new URL(normalised);
    const pathname = parsed.pathname || '';
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return parsed.hostname.toLowerCase().includes('leetcode') ? parsed.hostname.split('.')[0] : null;
    }

    if (provider === 'codeforces') {
      const profileIndex = segments.findIndex((segment) => ['profile', 'user', 'users'].includes(segment.toLowerCase()));
      if (profileIndex >= 0 && segments[profileIndex + 1]) {
        return segments[profileIndex + 1];
      }
      return segments[segments.length - 1];
    }

    if (provider === 'leetcode') {
      return segments[0];
    }

    return segments[segments.length - 1];
  } catch (error) {
    return null;
  }
};

const fallbackDisplayName = (user) => {
  if (user?.name) return user.name;
  if (user?.email) return user.email.split('@')[0];
  return 'Branch Connect member';
};

const buildSubtitle = (parts = []) => parts.filter((part) => Boolean(part && String(part).trim())).join(' • ') || null;

const storeCache = (provider, key, data) => {
  providerCache[provider].set(key, {
    fetchedAt: Date.now(),
    data
  });
};

const loadCodeforcesProfiles = async (handles, { signal } = {}) => {
  const results = new Map();
  const handlesToFetch = [];

  handles.forEach((handle) => {
    const lower = handle.toLowerCase();
    const cached = providerCache.codeforces.get(lower);
    if (isCacheEntryValid(cached)) {
      results.set(lower, cached.data);
    } else {
      handlesToFetch.push(lower);
    }
  });

  const chunkSize = 100;
  for (let i = 0; i < handlesToFetch.length; i += chunkSize) {
    const chunk = handlesToFetch.slice(i, i + chunkSize);
    const url = `${CODEFORCES_API_URL}?handles=${chunk.join(';')}`;

    try {
      const response = await fetchWithTimeout(url, {
        signal,
        headers: {
          'User-Agent': 'BranchConnectLeaderboardBot/1.0 (+https://branchconnect.example)',
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        chunk.forEach((handle) => storeCache('codeforces', handle, null));
        continue;
      }

      const payload = await response.json();
      if (payload.status !== 'OK' || !Array.isArray(payload.result)) {
        chunk.forEach((handle) => storeCache('codeforces', handle, null));
        continue;
      }

      payload.result.forEach((user) => {
        const key = user.handle?.toLowerCase();
        if (!key) return;
        const data = {
          handle: user.handle,
          rating: toNumberOrNull(user.rating),
          maxRating: toNumberOrNull(user.maxRating),
          rankTitle: user.rank || null,
          maxRankTitle: user.maxRank || null,
          contribution: toNumberOrNull(user.contribution)
        };
        storeCache('codeforces', key, data);
        results.set(key, data);
      });

      chunk.forEach((handle) => {
        if (!results.has(handle)) {
          const cached = providerCache.codeforces.get(handle);
          if (cached) {
            results.set(handle, cached.data);
          } else {
            storeCache('codeforces', handle, null);
            results.set(handle, null);
          }
        }
      });
    } catch (error) {
      chunk.forEach((handle) => {
        const cached = providerCache.codeforces.get(handle);
        if (!cached) {
          storeCache('codeforces', handle, null);
        }
        results.set(handle, cached?.data ?? null);
      });
    }
  }

  handles.forEach((handle) => {
    const lower = handle.toLowerCase();
    if (!results.has(lower)) {
      const cached = providerCache.codeforces.get(lower);
      results.set(lower, cached?.data ?? null);
    }
  });

  return results;
};

const loadLeetCodeProfiles = async (usernames, { signal } = {}) => {
  const results = new Map();

  for (const username of usernames) {
    const lower = username.toLowerCase();
    const cached = providerCache.leetcode.get(lower);
    if (isCacheEntryValid(cached)) {
      results.set(lower, cached.data);
      continue;
    }

    try {
      const response = await fetchWithTimeout(
        `${LEETCODE_RATING_API_URL}/${encodeURIComponent(username)}`,
        {
          method: 'GET',
          signal,
          headers: {
            'User-Agent': 'BranchConnectLeaderboardBot/1.0 (+https://branchconnect.example)',
            Accept: 'application/json'
          }
        }
      );

      if (!response.ok) {
        storeCache('leetcode', lower, null);
        results.set(lower, null);
        continue;
      }

      const payload = await response.json();
      const root = payload?.data || payload || {};
      const ranking = root?.userContestRanking
        || root?.contestRanking
        || root?.contestRankingData
        || root?.contest || null;
      const matchedUser = root?.matchedUser || root?.profile || null;

      const submissionStats = matchedUser?.submitStatsGlobal?.acSubmissionNum
        || matchedUser?.submitStats?.acSubmissionNum
        || root?.submissionCalendar
        || root?.acSubmissionNum
        || [];

      const solvedAllEntry = Array.isArray(submissionStats)
        ? submissionStats.find((item) => item?.difficulty === 'All')
        : null;

      const solvedFallback = toNumberOrNull(root?.totalSolved)
        ?? toNumberOrNull(root?.totalQuestionsSolved)
        ?? toNumberOrNull(root?.solvedProblem)
        ?? toNumberOrNull(root?.totalSolvedProblems)
        ?? null;

      const ratingValue = toNumberOrNull(ranking?.rating ?? ranking?.contestRating ?? root?.leetcodeContestRating);
      const contestCountValue = toNumberOrNull(
        ranking?.attendedContestsCount
        ?? ranking?.attendedContests
        ?? ranking?.contestAttend
        ?? root?.totalContestParticipated
      );
      const globalRankingValue = toNumberOrNull(
        ranking?.globalRanking
        ?? ranking?.ranking
        ?? ranking?.globalRank
        ?? ranking?.contestRanking
        ?? root?.ranking
      );
      const topPercentageValue = ranking?.topPercentage != null
        ? Number(ranking.topPercentage)
        : ranking?.topPercent != null
          ? Number(ranking.topPercent)
          : null;

      const solvedCountValue = toNumberOrNull(solvedAllEntry?.count)
        ?? solvedFallback;

      const data = {
        rating: Number.isFinite(ratingValue) ? Math.round(ratingValue) : null,
        contestCount: Number.isFinite(contestCountValue) ? contestCountValue : null,
        globalRanking: Number.isFinite(globalRankingValue) ? globalRankingValue : null,
        topPercentage: Number.isFinite(topPercentageValue) ? Number(topPercentageValue.toFixed(1)) : null,
        solvedCount: Number.isFinite(solvedCountValue) ? solvedCountValue : null
      };

      const needsBadgeData =
        data.rating == null
        || data.globalRanking == null
        || data.topPercentage == null
        || data.solvedCount == null;

      if (needsBadgeData) {
        const badgeData = await fetchLeetCodeBadgeData(username, { signal });
        if (badgeData) {
          if (data.rating == null) {
            const badgeRating = toNumberOrNull(badgeData.rating);
            if (badgeRating != null) {
              data.rating = Math.round(badgeRating);
            }
          }

          if (data.globalRanking == null) {
            const badgeGlobalRank = toNumberOrNull(badgeData.ranking);
            if (badgeGlobalRank != null) {
              data.globalRanking = badgeGlobalRank;
            }
          }

          if (data.topPercentage == null) {
            const badgeTopPercent = parseTopPercentage(badgeData.ratingQuantile);
            if (badgeTopPercent != null) {
              data.topPercentage = Number(badgeTopPercent.toFixed(1));
            }
          }

          if (data.solvedCount == null) {
            const badgeSolved = toNumberOrNull(badgeData.solved);
            if (badgeSolved != null) {
              data.solvedCount = badgeSolved;
            }
          }
        }
      }

      if (
        LEETCODE_GRAPHQL_ENABLED
        && (
        data.rating == null
        || data.contestCount == null
        || data.globalRanking == null
        || data.topPercentage == null
        || data.solvedCount == null
        )
      ) {
        const graphData = await fetchLeetCodeContestData(username, { signal });
        if (graphData) {
          const graphRanking = graphData.userContestRanking
            || graphData.contestRanking
            || graphData.contestRankingData
            || graphData.contest
            || null;
          const graphStats = graphData.matchedUser?.submitStatsGlobal?.acSubmissionNum
            || graphData.matchedUser?.submitStats?.acSubmissionNum
            || [];

          if (data.rating == null && graphRanking) {
            const graphRating = toNumberOrNull(
              graphRanking.rating
              ?? graphRanking.contestRating
              ?? graphRanking.currentRating
            );
            if (graphRating != null) {
              data.rating = Math.round(graphRating);
            }
          }

          if (data.contestCount == null && graphRanking) {
            const graphContestCount = toNumberOrNull(
              graphRanking.attendedContestsCount
              ?? graphRanking.attendedContests
              ?? graphRanking.contestAttend
            );
            if (graphContestCount != null) {
              data.contestCount = graphContestCount;
            }
          }

          if (data.globalRanking == null && graphRanking) {
            const graphGlobalRank = toNumberOrNull(
              graphRanking.globalRanking
              ?? graphRanking.ranking
              ?? graphRanking.globalRank
              ?? graphRanking.contestRanking
            );
            if (graphGlobalRank != null) {
              data.globalRanking = graphGlobalRank;
            }
          }

          if (data.topPercentage == null && graphRanking) {
            const rawTopPercentage = graphRanking.topPercentage ?? graphRanking.topPercent;
            if (rawTopPercentage != null) {
              const numericTop = Number(rawTopPercentage);
              if (Number.isFinite(numericTop)) {
                data.topPercentage = Number(numericTop.toFixed(1));
              }
            }
          }

          if (data.solvedCount == null) {
            const fallbackSolvedEntry = Array.isArray(graphStats)
              ? graphStats.find((item) => item?.difficulty === 'All')
              : null;
            const fallbackSolved = toNumberOrNull(fallbackSolvedEntry?.count);
            if (fallbackSolved != null) {
              data.solvedCount = fallbackSolved;
            }
          }
        }
      }

      storeCache('leetcode', lower, data);
      results.set(lower, data);
    } catch (error) {
      const cached = providerCache.leetcode.get(lower);
      if (!cached) {
        storeCache('leetcode', lower, null);
      }
      results.set(lower, cached?.data ?? null);
    }
  }

  return results;
};

const collectParticipants = async () => {
  const users = await User.find({
    $or: [
      { codeforces: { $exists: true, $ne: null, $ne: '' } },
      { leetcode: { $exists: true, $ne: null, $ne: '' } }
    ]
  }).select('name email collegeId place codeforces leetcode codechef github');

  return users.map((userDoc) => {
    const user = userDoc.toObject({ getters: true });
    const codeforcesHandle = extractHandleFromUrl(user.codeforces, 'codeforces');
    const leetcodeUsername = extractHandleFromUrl(user.leetcode, 'leetcode');

    return {
      id: userDoc._id?.toString(),
      displayName: fallbackDisplayName(user),
      collegeId: user.collegeId || null,
      place: user.place || null,
      profiles: {
        codeforces: user.codeforces || null,
        leetcode: user.leetcode || null,
        codechef: user.codechef || null,
        github: user.github || null
      },
      codeforcesHandle,
      leetcodeUsername
    };
  }).filter((participant) => participant.codeforcesHandle || participant.leetcodeUsername);
};

const composeCodeforcesLeaderboard = async (participants, limit, { signal } = {}) => {
  const codeforcesParticipants = participants.filter((participant) => participant.codeforcesHandle);
  const uniqueHandles = [...new Set(codeforcesParticipants.map((participant) => participant.codeforcesHandle.toLowerCase()))];

  const handleData = await loadCodeforcesProfiles(uniqueHandles, { signal });

  const entries = codeforcesParticipants
    .map((participant) => {
      const data = handleData.get(participant.codeforcesHandle.toLowerCase());
      const rating = toNumberOrNull(data?.rating) ?? toNumberOrNull(data?.maxRating);
      if (!Number.isFinite(rating) || rating <= 0) {
        return null;
      }

      const stats = [];
      if (Number.isFinite(data?.maxRating) && data.maxRating > rating) {
        stats.push({ label: 'Peak', value: data.maxRating });
      }
      if (data?.rankTitle) {
        stats.push({ label: 'Title', value: titleCase(data.rankTitle) });
      }

      const subtitle = buildSubtitle([
        `@${participant.codeforcesHandle}`,
        data?.rankTitle ? titleCase(data.rankTitle) : null,
        participant.collegeId ? participant.collegeId.toUpperCase() : participant.place
      ]);

      return {
        rank: 0,
        provider: 'codeforces',
        name: participant.displayName,
        subtitle,
        handle: participant.codeforcesHandle,
        rating: Math.round(rating),
        ratingLabel: 'Codeforces rating',
        stats,
        profiles: participant.profiles,
        userId: participant.id
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity))
    .slice(0, limit)
    .map((entry, index) => {
      const { sortScore, ...rest } = entry;
      return {
        ...rest,
        rank: index + 1
      };
    });

  return {
    entries,
    totalProfiles: codeforcesParticipants.length
  };
};

const composeLeetCodeLeaderboard = async (participants, limit, { signal } = {}) => {
  const leetcodeParticipants = participants.filter((participant) => participant.leetcodeUsername);
  const uniqueUsernames = [...new Set(leetcodeParticipants.map((participant) => participant.leetcodeUsername.toLowerCase()))];

  const usernameData = await loadLeetCodeProfiles(uniqueUsernames, { signal });

  const entries = leetcodeParticipants
    .map((participant) => {
      const data = usernameData.get(participant.leetcodeUsername.toLowerCase());
      const rating = toNumberOrNull(data?.rating);
      const solvedCount = toNumberOrNull(data?.solvedCount);
      const globalRanking = toNumberOrNull(data?.globalRanking);

      if (!Number.isFinite(rating) && !Number.isFinite(solvedCount)) {
        return null;
      }

      const ratingValue = Number.isFinite(rating) && rating > 0 ? Math.round(rating) : null;

      const stats = [];
      if (Number.isFinite(globalRanking) && globalRanking > 0) {
        stats.push({ label: 'Rank', value: globalRanking });
      }
      if (Number.isFinite(data?.solvedCount) && data.solvedCount >= 0) {
        stats.push({ label: 'Solved', value: data.solvedCount });
      }
      if (Number.isFinite(data?.contestCount) && data.contestCount > 0) {
        stats.push({ label: 'Contests', value: data.contestCount });
      }
      if (Number.isFinite(data?.topPercentage) && data.topPercentage > 0) {
        stats.push({ label: 'Top %', value: Number(data.topPercentage.toFixed(1)) });
      }

      const subtitle = buildSubtitle([
        `@${participant.leetcodeUsername}`,
        participant.collegeId ? participant.collegeId.toUpperCase() : participant.place
      ]);

      return {
        rank: 0,
        provider: 'leetcode',
        name: participant.displayName,
        subtitle,
        handle: participant.leetcodeUsername,
        rating: ratingValue,
        ratingLabel: ratingValue != null ? 'LeetCode rating' : 'Contest rating pending',
        stats,
        profiles: participant.profiles,
        userId: participant.id,
        sortScore: (() => {
          if (ratingValue != null) {
            return ratingValue;
          }
          if (Number.isFinite(solvedCount)) {
            return solvedCount;
          }
          if (Number.isFinite(globalRanking)) {
            return Number.MAX_SAFE_INTEGER - globalRanking;
          }
          return -Infinity;
        })()
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.sortScore ?? -Infinity) - (a.sortScore ?? -Infinity))
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

  return {
    entries,
    totalProfiles: leetcodeParticipants.length
  };
};

const getCompetitiveProgrammingLeaderboard = async ({ limit = 10, signal } = {}) => {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 50) : 10;
  const participants = await collectParticipants();

  const [codeforces, leetcode] = await Promise.all([
    composeCodeforcesLeaderboard(participants, safeLimit, { signal }),
    composeLeetCodeLeaderboard(participants, safeLimit, { signal })
  ]);

  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    summary: {
      participants: participants.length,
      codeforces: {
        totalProfiles: codeforces.totalProfiles,
        ranked: codeforces.entries.length
      },
      leetcode: {
        totalProfiles: leetcode.totalProfiles,
        ranked: leetcode.entries.length
      }
    },
    codeforces,
    leetcode
  };
};

module.exports = {
  getCompetitiveProgrammingLeaderboard
};

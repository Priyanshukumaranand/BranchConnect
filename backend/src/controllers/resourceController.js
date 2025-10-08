const { getCompetitiveProgrammingLeaderboard } = require('../services/leaderboardService');

exports.listResources = (req, res) => {
  res.json({
    placement: {
      driveFolder: 'https://drive.google.com/drive/folders/1UlIxN-hqY6FrOlk_9kOJfj3-TvWJL4ru'
    },
    exams: {
      driveFolder: 'https://drive.google.com/drive/folders/1ueFADGyyHUiyRs7kyHbNadwv6lElRL9P'
    }
  });
};

exports.getDsaLeaderboard = async (req, res, next) => {
  try {
    const limitParam = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? undefined : limitParam;

    const leaderboard = await getCompetitiveProgrammingLeaderboard({ limit });

    return res.json({
      leaderboard: {
        codeforces: leaderboard.codeforces,
        leetcode: leaderboard.leetcode
      },
      summary: leaderboard.summary,
      generatedAt: leaderboard.generatedAt
    });
  } catch (error) {
    return next(error);
  }
};

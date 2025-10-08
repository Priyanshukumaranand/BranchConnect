const dsaLeaderboard = require('../data/dsaLeaderboard');

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

exports.getDsaLeaderboard = (req, res) => {
  const limitParam = Number.parseInt(req.query.limit, 10);
  const limit = Number.isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);

  return res.json({
    leaderboard: dsaLeaderboard
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit)
  });
};

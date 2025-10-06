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

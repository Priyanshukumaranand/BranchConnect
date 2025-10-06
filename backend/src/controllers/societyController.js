const societies = [
  {
    name: 'Tech Society',
    slug: 'tech',
    focus: 'Hackathons, coding challenges, and open-source projects.'
  },
  {
    name: 'Cultural Collective',
    slug: 'cult',
    focus: 'Cultural showcases, theatre, and campus-wide events.'
  },
  {
    name: 'Entrepreneurship Cell',
    slug: 'ecell',
    focus: 'Startup bootcamps, mentorship, and pitch sessions.'
  }
];

exports.listSocieties = (req, res) => {
  res.json({ societies });
};

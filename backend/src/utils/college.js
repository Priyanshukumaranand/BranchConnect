const INSTITUTE_EMAIL_REGEX = /^b\d{6}@iiit-bh\.ac\.in$/i;
const COLLEGE_ID_REGEX = /^b\d{6}$/i;

const normaliseInput = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const normaliseInstituteEmail = (value) => normaliseInput(value);

const deriveCollegeIdFromEmail = (email) => {
  const normalisedEmail = normaliseInstituteEmail(email);
  const atIndex = normalisedEmail.indexOf('@');
  if (atIndex === -1) {
    return '';
  }
  return normalisedEmail.slice(0, atIndex);
};

const normaliseCollegeId = (value) => normaliseInput(value);

const isInstituteEmail = (value) => INSTITUTE_EMAIL_REGEX.test(normaliseInstituteEmail(value));

const isCollegeId = (value) => COLLEGE_ID_REGEX.test(normaliseCollegeId(value));

module.exports = {
  INSTITUTE_EMAIL_REGEX,
  COLLEGE_ID_REGEX,
  isInstituteEmail,
  isCollegeId,
  normaliseCollegeId,
  normaliseInstituteEmail,
  deriveCollegeIdFromEmail
};

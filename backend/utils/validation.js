const COLLEGE_USERNAME = /^\d{2}MCA[A-Z]\d{2}$/;

function normalizeUsername(value) {
  return String(value || '').trim().toUpperCase();
}

function validCollegeUsername(value) {
  return COLLEGE_USERNAME.test(normalizeUsername(value));
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

module.exports = { normalizeUsername, validCollegeUsername, positiveInteger };

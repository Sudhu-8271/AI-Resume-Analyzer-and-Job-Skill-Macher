function matchSkills(resumeSkills, jobSkills) {

  const matched = resumeSkills.filter(skill =>
    jobSkills.includes(skill)
  );

  const missing = jobSkills.filter(skill =>
    !resumeSkills.includes(skill)
  );

  const score = (matched.length / jobSkills.length) * 100;

  return {
    score: score.toFixed(2),
    matchedSkills: matched,
    missingSkills: missing
  };

}

module.exports = matchSkills;
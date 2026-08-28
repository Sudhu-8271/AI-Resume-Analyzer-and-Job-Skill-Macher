const skillsList = [
  "javascript",
  "react",
  "node",
  "mongodb",
  "express",
  "python",
  "java",
  "machine learning",
  "aws",
  "docker",
  "html",
  "css",
  "sql"
];

function extractSkills(text) {

  const lowerText = text.toLowerCase();

  const detectedSkills = skillsList.filter(skill =>
    lowerText.includes(skill)
  );

  return detectedSkills;

}

module.exports = extractSkills;
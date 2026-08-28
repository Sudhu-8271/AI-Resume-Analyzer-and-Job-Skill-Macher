const nlp = require("compromise");

const knownSkills = [
  "javascript",
  "react",
  "node",
  "express",
  "mongodb",
  "python",
  "tensorflow",
  "docker",
  "kubernetes",
  "aws",
  "machine learning",
  "deep learning",
  "sql",
  "typescript",
  "graphql",
  "system design"
];

function extractSkills(text) {

  const doc = nlp(text.toLowerCase());

  const tokens = doc.terms().out("array");

  const detectedSkills = [];

  knownSkills.forEach(skill => {

    if (text.toLowerCase().includes(skill)) {
      detectedSkills.push(skill);
    }

  });

  return [...new Set(detectedSkills)];
}

module.exports = extractSkills;
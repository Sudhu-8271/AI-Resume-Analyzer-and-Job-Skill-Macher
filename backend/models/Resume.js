const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  fileName: String,
  mimeType: String,
  fileData: Buffer,

  resumeText: String,

  jobDescription: String,

  matchScore: Number,

  matchedSkills: [String],

  missingSkills: [String],

  resumeSkills: [String],

  jdSkills: [String],

  aiAnalysis: String,
  analysisReport: mongoose.Schema.Types.Mixed,
  marketAnalysis: mongoose.Schema.Types.Mixed,
  sessionId: String

}, {
  timestamps: true
});

module.exports = mongoose.model("Resume", resumeSchema);
const fs = require("fs");
const pdf = require("pdf-parse");
const extractSkills = require("../utils/skillExtractor");
const matchSkills = require("../utils/skillMatcher");
const getRecommendations = require("../utils/skillAdvisor");
const ScoringEngine = require("../utils/scoringEngine");
const AnalysisReportGenerator = require("../utils/analysisReportGenerator");

exports.uploadResume = async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const dataBuffer = fs.readFileSync(req.file.path);

    const data = await pdf(dataBuffer);
    const resumeText = data.text || "";
    const skills = extractSkills(resumeText);
    const jobDescription = req.body.jobDescription || "";
    const jobSkills = extractSkills(jobDescription);

    // basic matching to get matched / missing lists
    const basicMatch = matchSkills(skills, jobSkills);
    const matchedSkills = basicMatch.matchedSkills || [];
    const missingSkills = basicMatch.missingSkills || [];

    // Use centralized scoring engine for consistent score
    const scoring = ScoringEngine.calculateMatchScore({
      matchedSkills,
      missingSkills,
      resumeSkills: skills,
      jdSkills: jobSkills,
      resumeText,
      jobDescription,
      experienceYears: AnalysisReportGenerator.extractExperienceYears
        ? AnalysisReportGenerator.extractExperienceYears(resumeText)
        : 0,
      educationMatch: /bachelor|master|phd|diploma/i.test(resumeText),
    });

    const analysisReport = AnalysisReportGenerator.generateReport(
      { resumeText, resumeSkills: skills, jdSkills: jobSkills, matchedSkills, missingSkills, matchScore: scoring.matchScore },
      jobDescription
    );

    const recommendations = getRecommendations(missingSkills);

    res.json({
      message: "Resume analyzed successfully",
      resumeSkills: skills,
      resumeText,
      jobSkills: jobSkills,
      matchScore: scoring.matchScore,
      scoreBreakdown: scoring.breakdown,
      confidence: scoring.confidence,
      matchedSkills: matchedSkills,
      missingSkills: missingSkills,
      recommendations: recommendations,
      analysisReport,
    });

  } catch (error) {

    console.error(error);
    res.status(500).send("Error extracting text");

  }

};
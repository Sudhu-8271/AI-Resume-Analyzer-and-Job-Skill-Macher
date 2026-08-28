require("dotenv").config();

process.on("warning", () => {});
process.env.PDFJS_DISABLE_FONT_FACE = "true";

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const pdfParse = require("pdf-parse");
const cookieParser = require('cookie-parser');

const connectDB = require("./config/db");
const Resume = require("./models/Resume");
const analyzeWithAI = require("./ai/groqService");

// NEW: Import centralized utilities
const ScoringEngine = require("./utils/scoringEngine");
const AnalysisReportGenerator = require("./utils/analysisReportGenerator");
const ResumeContextBuilder = require("./utils/resumeContextBuilder");
const InterviewQuestionGenerator = require("./utils/interviewQuestionGenerator");
const SkillMarketAnalyzer = require("./utils/skillMarketAnalyzer");
const { globalSessionManager } = require("./utils/sessionMemoryManager");

// CHAT ROUTES
const chatbotRoutes = require("./routes/chatbotRoutes");
const profileRoutes = require('./routes/profileRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { requireAuth } = require('./middleware/authMiddleware');

const app = express();

connectDB();

// FIXED CORS CONFIG 👇 (allows credentials + specific origin instead of wildcard)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// IMPORTANT FIX 👉 chatbot route only /api
app.use("/api", chatbotRoutes);

// AUTH ROUTES
const authRoutes = require("./routes/authRoutes");
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

// Interview AI endpoints
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interview', interviewRoutes);

const upload = multer();

// Root
app.get("/", (req, res) => {
  res.send("AI Resume Analyzer Backend - Enhanced Edition Running");
});

// COMPREHENSIVE SKILLS LIST
const skillsList = [
  "javascript","react","react.js","node","node.js","express","express.js",
  "mongodb","mysql","html","css","python","java","c++","sql","docker",
  "kubernetes","aws","redis","typescript","git","github","rest api","machine learning",
  "tensorflow","pytorch","angular","vue","graphql","nodejs","golang","rust",
  "postgresql","elasticsearch","jenkins","terraform","gcp","azure","linux",
  "agile","scrum","api","web development","mobile development","devops",
  "data science","artificial intelligence","generative ai","llm"
];

function normalizeSkill(skill) {
  const map = {
    "node.js": "node",
    "express.js": "express",
    "react.js": "react",
    "machine learning": "ml",
    "rest api": "rest"
  };
  return map[skill] || skill;
}

/**
 * ENHANCED ANALYZE ENDPOINT
 * Uses centralized scoring engine, generates comprehensive reports
 */
app.post("/analyze", requireAuth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No resume file provided" });
    }

    const jobDescription = req.body.jobDescription || "";
    const sessionId = req.body.sessionId || `session_${Date.now()}`;

    // Parse resume
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;
    const resumeTextLower = resumeText.toLowerCase();
    const jdText = jobDescription.toLowerCase();

    // Extract skills
    let resumeSkills = skillsList.filter(s => resumeTextLower.includes(s));
    let jdSkills = skillsList.filter(s => jdText.includes(s));

    resumeSkills = [...new Set(resumeSkills.map(normalizeSkill))];
    jdSkills = [...new Set(jdSkills.map(normalizeSkill))];

    const matchedSkills = resumeSkills.filter(s => jdSkills.includes(s));
    const missingSkills = jdSkills.filter(s => !resumeSkills.includes(s));

    // CENTRALIZED SCORING ENGINE ✨
    const scoring = ScoringEngine.calculateMatchScore({
      matchedSkills,
      missingSkills,
      resumeSkills,
      jdSkills,
      resumeText,
      jobDescription,
      experienceYears: AnalysisReportGenerator.extractExperienceYears
        ? AnalysisReportGenerator.extractExperienceYears(resumeText)
        : 0,
      educationMatch: /bachelor|master|phd|diploma/i.test(resumeText),
    });

    const matchScore = scoring.matchScore;

    // COMPREHENSIVE ANALYSIS REPORT ✨
    const analysisReport = AnalysisReportGenerator.generateReport(
      { resumeText, resumeSkills, jdSkills, matchedSkills, missingSkills, matchScore },
      jobDescription
    );

    // AI ANALYSIS ✨
    const aiAnalysis = await analyzeWithAI({
      resumeText,
      jobDescription,
      matchScore,
      matchedSkills,
      missingSkills,
      resumeSkills,
      jdSkills,
      report: analysisReport,
    });

    // RESUME-AWARE CONTEXT ✨
    const resumeContext = ResumeContextBuilder.buildContext(
      { resumeText, resumeSkills, missingSkills, matchedSkills, matchScore },
      jobDescription
    );

    // INTERVIEW QUESTIONS ✨
    const interviewQuestions = InterviewQuestionGenerator.generateInterviewQuestions(
      { skills: resumeSkills, resumeText,experience: { years: AnalysisReportGenerator.extractExperienceYears ? AnalysisReportGenerator.extractExperienceYears(resumeText) : 0 } },
      jobDescription
    );

    // MARKET ANALYSIS ✨
    const marketAnalyzer = new SkillMarketAnalyzer();
    const marketAnalysis = marketAnalyzer.generateMarketReport({
      skills: resumeSkills,
      experience: { years: AnalysisReportGenerator.extractExperienceYears ? AnalysisReportGenerator.extractExperienceYears(resumeText) : 0 }
    });

    // SESSION MEMORY ✨
    const session = globalSessionManager.createSession(sessionId, {
      resumeText,
      resumeSkills,
      missingSkills,
      matchedSkills,
      matchScore,
      jdSkills,
    });

    // Save to database
    const newResume = new Resume({
      userId: req.user.userId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileData: req.file.buffer,
      matchScore,
      matchedSkills,
      missingSkills,
      resumeSkills,
      jdSkills,
      aiAnalysis,
      analysisReport,
      marketAnalysis,
      sessionId,
    });

    await newResume.save();

    // CONSISTENT RESPONSE ✨
    res.json({
      success: true,
      sessionId,
      resumeText,
      jobDescription,
      matchScore, // CENTRALIZED SCORE
      scoreBreakdown: scoring.breakdown,
      confidence: scoring.confidence,
      matchedSkills,
      missingSkills,
      resumeSkills,
      jdSkills,
      aiAnalysis,
      analysisReport,
      interviewQuestions,
      marketAnalysis,
      resumeContext,
      metadata: {
        analysisGeneratedAt: new Date().toISOString(),
        resumeLength: resumeText.length,
        skillsExtracted: resumeSkills.length,
      }
    });

  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error analyzing resume"
    });
  }
});

/**
 * INTERVIEW QUESTIONS ENDPOINT
 * Generates unlimited interview questions based on resume
 */
app.post("/api/interview-questions", (req, res) => {
  try {
    const { sessionId, difficulty = "Medium" } = req.body;
    const session = globalSessionManager.getSession(sessionId);

    if (!session) {
      return res.status(400).json({ error: "Session not found" });
    }

    const questions = InterviewQuestionGenerator.generateInterviewQuestions(
      { skills: session.resumeData.resumeSkills || [] }
    );

    const allQuestions = Object.values(questions).flat();
    const filtered = difficulty 
      ? allQuestions.filter(q => q.difficulty === difficulty)
      : allQuestions;

    res.json({
      success: true,
      totalQuestions: filtered.length,
      questions: filtered.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * MARKET ANALYSIS ENDPOINT
 * Returns market trends and skill demand insights
 */
app.post("/api/market-analysis", (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = globalSessionManager.getSession(sessionId);

    if (!session) {
      return res.status(400).json({ error: "Session not found" });
    }

    const analyzer = new SkillMarketAnalyzer();
    const report = analyzer.generateMarketReport({
      skills: session.resumeData.resumeSkills || [],
      experience: { years: 0 },
    });

    res.json({ success: true, ...report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HELPER: Extract experience years
function extractExperienceYears(text) {
  const match = text.match(/(\d+)\s*(?:years?|yr)/i);
  return match ? parseInt(match[1]) : 0;
}

let PORT = parseInt(process.env.PORT, 10) || 5001;
// If PORT was accidentally inherited from frontend dev (common default 3002), prefer backend dev port 5001
if (PORT === 3002) PORT = 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    const fallbackPort = PORT === 5000 ? 5001 : 5000;
    console.warn(`Port ${PORT} busy, trying ${fallbackPort} instead.`);
    app.listen(fallbackPort, () => {
      console.log(`🚀 Backend running on fallback port ${fallbackPort}`);
    });
  } else {
    console.error("Server error:", err);
  }
});
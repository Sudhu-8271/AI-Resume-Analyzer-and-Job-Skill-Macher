const analyzeWithAI = require('../ai/groqService');
const { analyzeInterviewAnswer } = require('../ai/groqService');

exports.analyzeAnswer = async (req, res) => {
  try {
    const { question, answer, role, difficulty } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });
    const evaluation = await analyzeInterviewAnswer({ question, answer, answerDuration: req.body.answerDuration || 0, wordCount: req.body.wordCount || 0, role, difficulty });
    res.json({ success: true, evaluation });
  } catch (err) {
    console.error('analyzeAnswer error', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { history, sessionId } = req.body;
    if (!history || !Array.isArray(history)) return res.status(400).json({ error: 'Missing history array' });

    const prompt = `You are an interview performance evaluator. Return JSON with overallScore, answerQualityScore, communicationScore, relevanceScore, speakingScore, presentationScore, strengths, improvements, and questions. Use only the supplied records and observable metrics. Do not infer sensitive or psychological traits. History: ${JSON.stringify(history)}`;

    const aiResponse = await analyzeWithAI({ resumeText: prompt, jobDescription: '', matchScore: 0, matchedSkills: [], missingSkills: [], resumeSkills: [], jdSkills: [] });

    let parsed = null;
    try { parsed = JSON.parse(aiResponse); } catch (e) { parsed = { reportText: aiResponse }; }

    res.json({ success: true, report: parsed });
  } catch (err) {
    console.error('generateReport error', err);
    res.status(500).json({ error: 'AI report failed' });
  }
};

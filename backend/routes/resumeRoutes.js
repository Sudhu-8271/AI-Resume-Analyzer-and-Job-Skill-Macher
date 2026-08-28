const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function analyzeWithAI(resumeText, jobDescription) {
  try {
    const prompt = `
You are an expert AI Resume Analyzer.

Analyze resume vs job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return:
- Match Score %
- Matching Skills
- Missing Skills
- Improvements
- Final Suggestions
`;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 800,
    });

    return response.choices?.[0]?.message?.content || "No response";
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "AI analysis failed.";
  }
}

module.exports = analyzeWithAI;
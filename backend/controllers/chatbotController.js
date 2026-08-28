const Groq = require("groq-sdk");
const ResumeContextBuilder = require("../utils/resumeContextBuilder");
const { globalSessionManager } = require("../utils/sessionMemoryManager");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * RESUME-AWARE AI CHATBOT
 * Context-driven responses based on resume, job description, and market trends
 */
exports.chatbot = async (req, res) => {
  try {
    const {
      message,
      resumeSkills = [],
      missingSkills = [],
      matchedSkills = [],
      matchScore = 0,
      jdSkills = [],
      jobDescription = "",
      resumeText = "",
      chatHistory = [],
      sessionId = "",
    } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Load session if available
    let session = null;
    if (sessionId) {
      session = globalSessionManager.getSession(sessionId);
    }

    // Build resume context for RAG
    const resumeContext = ResumeContextBuilder.buildContext(
      {
        resumeText,
        resumeSkills,
        missingSkills,
        matchedSkills,
        matchScore,
      },
      jobDescription
    );

    // Add message to session memory
    if (session) {
      globalSessionManager.addMessage(sessionId, "user", message);
    }

    // Build system prompt with context
    const systemPrompt = ResumeContextBuilder.generateSystemPrompt(resumeContext);

    // Prepare conversation history for context
    const conversationHistory = (chatHistory || [])
      .slice(-10)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

    // Current turn
    const messages = [
      ...conversationHistory,
      {
        role: "user",
        content: message,
      },
    ];

    // GROQ API CALL with context-aware prompt
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0].message.content;

    // Add AI response to session memory
    if (session) {
      globalSessionManager.addMessage(sessionId, "ai", aiResponse);
    }

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(message, resumeSkills, aiResponse);

    // Generate follow-up suggestions based on context
    const followUpSuggestions = generateFollowUpQuestions(
      message,
      resumeSkills,
      missingSkills,
      matchedSkills
    );

    res.json({
      success: true,
      response: aiResponse,
      reply: aiResponse,
      confidence: confidenceScore,
      followUpSuggestions,
      context: {
        matchScore,
        skillsUsed: matchedSkills.slice(0, 5),
        skillsNeeded: missingSkills.slice(0, 5),
      },
      sessionId: sessionId || "no-session",
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Chatbot error",
    });
  }
};

/**
 * Calculate confidence score for AI response
 * Based on context relevance and data availability
 */
function calculateConfidenceScore(userMessage, resumeSkills, aiResponse) {
  let confidence = 0.5; // Base confidence

  // Check if response addresses resume
  if (resumeSkills.some((skill) =>
    aiResponse.toLowerCase().includes(skill.toLowerCase())
  )) {
    confidence += 0.2;
  }

  // Check if response is specific (not generic)
  if (aiResponse.length > 200 && aiResponse.split("\n").length > 3) {
    confidence += 0.15;
  }

  // Check for reasoning/explanation
  if (/because|therefore|as a result|based on/i.test(aiResponse)) {
    confidence += 0.1;
  }

  // Check if it avoids generic phrases
  const genericPhrases = [
    "generally speaking",
    "in most cases",
    "typically",
    "usually",
  ];
  const hasGeneric = genericPhrases.some((phrase) =>
    aiResponse.toLowerCase().includes(phrase)
  );
  if (!hasGeneric) {
    confidence += 0.05;
  }

  return Math.min(1, confidence); // Max 1.0
}

/**
 * Generate contextual follow-up questions
 */
function generateFollowUpQuestions(
  userMessage,
  resumeSkills,
  missingSkills,
  matchedSkills
) {
  const suggestions = [];

  // Detect question type and suggest relevant follow-ups
  const messageLower = userMessage.toLowerCase();

  if (messageLower.includes("skill")) {
    if (missingSkills.length > 0) {
      suggestions.push(
        `Would you like to know how to learn ${missingSkills[0]}?`
      );
    }
    if (matchedSkills.length > 0) {
      suggestions.push(
        `Want tips to improve your ${matchedSkills[0]} skills?`
      );
    }
  }

  if (messageLower.includes("ready") || messageLower.includes("match")) {
    suggestions.push(
      "What specific areas should I focus on for this role?"
    );
    suggestions.push("Can you help me create a learning plan?");
  }

  if (messageLower.includes("project") || messageLower.includes("build")) {
    suggestions.push(
      "What type of project would showcase my skills best?"
    );
  }

  if (messageLower.includes("interview")) {
    suggestions.push("Want me to ask you a technical interview question?");
    suggestions.push("Should I suggest common interview tips?");
  }

  // Return top 2 suggestions
  return suggestions.slice(0, 2);
}

/**
 * ADVANCED: Generate contextual insights
 */
function generateContextualInsights(
  message,
  resumeContext,
  jobContext,
  matchScore
) {
  const insights = {};

  // Skill gap analysis
  if (message.includes("improve") || message.includes("gap")) {
    insights.skillGapAnalysis = {
      missingSkills: resumeContext.skills?.missing || [],
      learningTimeEstimate: "4-8 weeks",
      priority: matchScore < 50 ? "HIGH" : "MEDIUM",
    };
  }

  // Market readiness
  if (message.includes("ready") || message.includes("apply")) {
    insights.marketReadiness = matchScore >= 70 ? "READY" : "DEVELOPING";
  }

  return insights;
}

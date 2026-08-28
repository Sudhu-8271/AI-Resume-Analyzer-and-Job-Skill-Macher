import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";

const DEFAULT_QUESTIONS = [
  {
    questionId: "intro",
    question:
      "Tell me about yourself and your professional background.",
  },
  {
    questionId: "strengths",
    question:
      "What are your biggest strengths for this role?",
  },
  {
    questionId: "experience",
    question:
      "Tell me about an experience that is relevant to this role.",
  },
  {
    questionId: "project",
    question:
      "Tell me about a project you are proud of and your contribution to it.",
  },
  {
    questionId: "challenge",
    question:
      "Describe a difficult problem you solved and how you solved it.",
  },
  {
    questionId: "goals",
    question:
      "Why are you interested in this role and what are you looking for in your next position?",
  },
];

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition ||
      window.webkitSpeechRecognition
    : null;

const SILENCE_MS = 1600;
const MIN_ANSWER_MS = 1200;

const wordCount = (text = "") =>
  text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

const average = (values = []) =>
  values.length
    ? Math.round(
        values.reduce(
          (sum, value) =>
            sum + Number(value || 0),
          0
        ) / values.length
      )
    : 0;

const normalizeText = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .trim();

function releaseMedia(stream, audioContext) {
  try {
    stream?.getTracks()?.forEach((track) =>
      track.stop()
    );
  } catch (error) {
    console.warn(
      "Unable to stop media tracks:",
      error
    );
  }

  try {
    if (
      audioContext &&
      audioContext.state !== "closed"
    ) {
      audioContext.close().catch(() => {});
    }
  } catch (error) {
    console.warn(
      "Unable to close audio context:",
      error
    );
  }
}

function getInterviewProfile() {
  const possibleResumeKeys = [
    "resume",
    "resumeData",
    "resumeText",
    "userResume",
    "candidateResume",
    "profile",
    "userProfile",
  ];

  const possibleRoleKeys = [
    "jobRole",
    "job_role",
    "role",
    "targetRole",
    "selectedRole",
    "position",
    "jobTitle",
  ];

  let resume = "";
  let jobRole = "";

  for (const key of possibleResumeKeys) {
    const raw = localStorage.getItem(key);

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      if (typeof parsed === "string") {
        resume = parsed;
      } else if (parsed) {
        resume =
          parsed.resumeText ||
          parsed.text ||
          parsed.resume ||
          parsed.content ||
          parsed.summary ||
          JSON.stringify(parsed);
      }
    } catch {
      resume = raw;
    }

    if (resume) break;
  }

  for (const key of possibleRoleKeys) {
    const raw = localStorage.getItem(key);

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      if (typeof parsed === "string") {
        jobRole = parsed;
      } else if (parsed) {
        jobRole =
          parsed.jobRole ||
          parsed.role ||
          parsed.title ||
          parsed.position ||
          parsed.name ||
          "";
      }
    } catch {
      jobRole = raw;
    }

    if (jobRole) break;
  }

  return {
    resume: normalizeText(resume),
    jobRole: normalizeText(jobRole),
  };
}

function buildFallbackQuestions(
  resume,
  jobRole
) {
  const role =
    normalizeText(jobRole) ||
    "this position";

  const resumeText =
    normalizeText(resume);

  const lowerResume =
    resumeText.toLowerCase();

  const questions = [
    {
      questionId: "intro",
      question: `Tell me about yourself and explain how your background prepares you for the ${role} role.`,
    },
    {
      questionId: "role-strengths",
      question: `What are your strongest skills for a ${role} position? Please give examples from your experience.`,
    },
  ];

  if (
    lowerResume.includes("project") ||
    lowerResume.includes("developed") ||
    lowerResume.includes("built")
  ) {
    questions.push({
      questionId: "resume-project",
      question: `Looking at your experience, tell me about a project you worked on that is most relevant to the ${role} role.`,
    });
  } else {
    questions.push({
      questionId: "experience",
      question: `Which experience from your resume is most relevant to the ${role} role, and why?`,
    });
  }

  if (
    lowerResume.includes("team") ||
    lowerResume.includes("lead") ||
    lowerResume.includes("leadership")
  ) {
    questions.push({
      questionId: "teamwork",
      question:
        "Tell me about a time you worked with or led a team. What was your responsibility and what was the outcome?",
    });
  } else {
    questions.push({
      questionId: "challenge",
      question:
        "Describe a difficult technical or professional problem you faced and how you solved it.",
    });
  }

  questions.push({
    questionId: "achievement",
    question:
      "What is the most important achievement in your career so far, and what did you personally contribute?",
  });

  questions.push({
    questionId: "motivation",
    question: `Why are you interested in this ${role} position, and why do you think you would be a good fit?`,
  });

  return questions.slice(0, 6);
}

/*
|--------------------------------------------------------------------------
| QUESTION INTENT
|--------------------------------------------------------------------------
*/
function getQuestionIntent(question = "") {
  const q = normalizeText(question).toLowerCase();

  if (
    /tell me about yourself|introduce yourself|walk me through your background/.test(
      q
    )
  ) {
    return "about";
  }

  if (
    /biggest strengths|strongest skills|greatest strengths|what are you good at|what skills/.test(
      q
    )
  ) {
    return "strengths";
  }

  if (
    /most important achievement|greatest achievement|accomplishment|proud of/.test(
      q
    )
  ) {
    return "achievement";
  }

  if (
    /difficult problem|difficult situation|challenge|obstacle|problem you solved/.test(
      q
    )
  ) {
    return "challenge";
  }

  if (
    /why are you interested|why do you want|why this role|why this position|why this company|good fit|motivat/.test(
      q
    )
  ) {
    return "motivation";
  }

  if (
    /team|leadership|led a team|worked with a team|conflict with/.test(
      q
    )
  ) {
    return "teamwork";
  }

  if (
    /project|built|developed|created|worked on/.test(
      q
    )
  ) {
    return "project";
  }

  if (
    /experience|previous role|previous work|background/.test(
      q
    )
  ) {
    return "experience";
  }

  return "general";
}

/*
|--------------------------------------------------------------------------
| LOCAL ANSWER EVALUATION - ACCURATE QUESTION-BASED SCORING
|--------------------------------------------------------------------------
*/
function localEvaluateAnswer(
  answer,
  question,
  resume = "",
  jobRole = ""
) {
  const text = normalizeText(answer || "").trim();
  const questionText = normalizeText(question || "").trim();

  const lower = text.toLowerCase();
  const lowerQuestion = questionText.toLowerCase();

  const words = wordCount(text);
  const intent = getQuestionIntent(questionText);

  if (!text) {
    return {
      answerScore: 0,
      relevanceScore: 0,
      clarityScore: 0,
      completenessScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      strengths: [],
      improvements: [
        "You did not provide an answer."
      ],
      detailedFeedback:
        "Please answer the question directly before finishing your response.",
      fullMarksGuide: getFullMarksGuide(
        intent,
        questionText,
        jobRole
      ),
      answerOnTopic: false
    };
  }

  const hasAny = (...values) =>
    values.some((value) =>
      lower.includes(value.toLowerCase())
    );

  const questionHasAny = (...values) =>
    values.some((value) =>
      lowerQuestion.includes(value.toLowerCase())
    );

  const countMatches = (patterns) => {
    return patterns.reduce((count, pattern) => {
      return count + (
        lower.includes(pattern.toLowerCase())
          ? 1
          : 0
      );
    }, 0);
  };

  const clamp = (value, min = 0, max = 100) =>
    Math.max(min, Math.min(max, Math.round(value)));

  const unique = (items) =>
    [...new Set(items)];

  let effectiveIntent = intent || "general";

  if (
    questionHasAny(
      "tell me about yourself",
      "introduce yourself",
      "walk me through your background",
      "about yourself"
    )
  ) {
    effectiveIntent = "about";
  } else if (
    questionHasAny(
      "what are your strengths",
      "greatest strength",
      "biggest strength",
      "key strengths"
    )
  ) {
    effectiveIntent = "strengths";
  } else if (
    questionHasAny(
      "greatest achievement",
      "biggest achievement",
      "proudest achievement",
      "accomplishment",
      "achievement"
    )
  ) {
    effectiveIntent = "achievement";
  } else if (
    questionHasAny(
      "challenge",
      "challenging",
      "difficult situation",
      "difficult problem",
      "problem you faced",
      "obstacle"
    )
  ) {
    effectiveIntent = "challenge";
  } else if (
    questionHasAny(
      "project",
      "project you worked on",
      "project you built"
    )
  ) {
    effectiveIntent = "project";
  } else if (
    questionHasAny(
      "why do you want",
      "why are you interested",
      "why this role",
      "why this position",
      "why this company",
      "what motivates you",
      "motivation"
    )
  ) {
    effectiveIntent = "motivation";
  } else if (
    questionHasAny(
      "team",
      "teamwork",
      "worked with others",
      "conflict with a colleague",
      "conflict with a teammate",
      "lead a team"
    )
  ) {
    effectiveIntent = "teamwork";
  } else if (
    questionHasAny(
      "experience",
      "have you worked",
      "previous role",
      "previous job",
      "professional experience"
    )
  ) {
    effectiveIntent = "experience";
  }

  const hasBackground = hasAny(
    "student",
    "graduate",
    "degree",
    "computer science",
    "education",
    "experience",
    "worked",
    "working",
    "developer",
    "engineer",
    "intern",
    "professional",
    "career",
    "background"
  );

  const hasConnection = hasAny(
    "this role",
    "this position",
    "this job",
    "this company",
    "good fit",
    "strong fit",
    "relevant",
    "contribute",
    "apply my",
    "use my",
    "suitable",
    "prepare me",
    "prepares me",
    "help me",
    "aligns with",
    "align with",
    "matches",
    "fits"
  );

  const hasChallenge = hasAny(
    "challenge",
    "challenging",
    "problem",
    "difficult",
    "issue",
    "obstacle",
    "blocked",
    "failure",
    "mistake"
  );

  const firstPersonCount =
    (
      lower.match(
        /\b(i|i'm|i've|i'd|my|me|we|our)\b/g
      ) || []
    ).length;

  const actionCount = countMatches([
    "developed",
    "built",
    "created",
    "designed",
    "implemented",
    "managed",
    "led",
    "solved",
    "improved",
    "organized",
    "delivered",
    "analyzed",
    "tested",
    "debugged",
    "launched",
    "coordinated",
    "researched",
    "presented",
    "automated",
    "optimized",
    "planned",
    "executed",
    "contributed",
    "handled",
    "resolved",
    "worked on",
    "worked with",
    "my role",
    "i did",
    "i was responsible",
    "i developed",
    "i built",
    "i created",
    "i implemented",
    "i solved",
    "i managed",
    "i led"
  ]);

  const skillCount = countMatches([
    "javascript",
    "typescript",
    "react",
    "angular",
    "vue",
    "python",
    "java",
    "c++",
    "c#",
    "sql",
    "node",
    "node.js",
    "html",
    "css",
    "api",
    "database",
    "git",
    "aws",
    "azure",
    "docker",
    "machine learning",
    "data analysis",
    "communication",
    "leadership",
    "management",
    "problem solving",
    "problem-solving",
    "teamwork",
    "collaboration",
    "programming",
    "development"
  ]);

  const resultCount = countMatches([
    "result",
    "outcome",
    "impact",
    "achieved",
    "success",
    "successful",
    "completed",
    "delivered",
    "improved",
    "increased",
    "reduced",
    "saved",
    "faster",
    "better",
    "efficient",
    "efficiency",
    "performance",
    "revenue",
    "users",
    "customers",
    "deadline",
    "on time",
    "percent",
    "%",
    "reached",
    "exceeded"
  ]);

  const reasonCount = countMatches([
    "because",
    "therefore",
    "so that",
    "which allowed",
    "which helped",
    "i wanted",
    "i chose",
    "i decided",
    "i was interested",
    "i am interested",
    "passionate",
    "enjoy",
    "motivated",
    "career",
    "learn",
    "learned",
    "grow",
    "future"
  ]);

  const exampleCount = countMatches([
    "for example",
    "for instance",
    "during my",
    "in my",
    "at my",
    "when i",
    "while i",
    "on a project",
    "on one project",
    "during an internship",
    "during my internship",
    "at university",
    "at college",
    "in college",
    "in university",
    "in my previous role"
  ]);

  const hasNumber =
    /\b\d+(?:\.\d+)?\b/.test(text);

  const hasPercentage =
    /\b\d+(?:\.\d+)?\s*%/.test(text);

  const hasTimeReference = hasAny(
    "week",
    "weeks",
    "month",
    "months",
    "year",
    "years",
    "days",
    "deadline",
    "within",
    "over the course"
  );

  let specificityScore = 30;

  if (hasNumber) specificityScore += 15;
  if (hasPercentage) specificityScore += 10;
  if (hasTimeReference) specificityScore += 10;
  if (skillCount >= 1) specificityScore += 10;
  if (actionCount >= 1) specificityScore += 10;
  if (resultCount >= 1) specificityScore += 10;
  if (exampleCount > 0) specificityScore += 5;

  specificityScore = clamp(specificityScore);

  const vaguePhrases = [
    "hardworking",
    "good team player",
    "fast learner",
    "passionate",
    "dedicated",
    "motivated person",
    "always give my best",
    "do my best",
    "good communication skills",
    "strong communication",
    "i am very good at",
    "i can do anything",
    "i am flexible",
    "i work hard",
    "i am responsible",
    "i am a perfectionist",
    "i like challenges",
    "i love technology",
    "i am interested in technology"
  ];

  const vagueCount = countMatches(vaguePhrases);

  const genericStatements = countMatches([
    "i am hardworking",
    "i am passionate",
    "i am motivated",
    "i am a team player",
    "i am a quick learner",
    "i have good communication",
    "i have strong communication",
    "i am dedicated",
    "i always try my best"
  ]);

  const questionKeywords = lowerQuestion
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(word =>
      word.length > 3 &&
      ![
        "what",
        "when",
        "where",
        "which",
        "would",
        "could",
        "should",
        "have",
        "your",
        "about",
        "tell",
        "please",
        "describe",
        "explain",
        "give",
        "from",
        "with",
        "this",
        "that",
        "role",
        "position"
      ].includes(word)
    );

  let questionOverlap = 0;

  questionKeywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      questionOverlap++;
    }
  });

  const overlapRatio =
    questionKeywords.length > 0
      ? questionOverlap / questionKeywords.length
      : 0;

  // ============================================================
  // ACCURATE SCORING BASED ON QUESTION RELEVANCE
  // ============================================================

  // 1. Intent Match Score - checks if answer contains intent-specific keywords
  let intentMatchScore = 0;
  let intentKeywords = [];

  if (effectiveIntent === "about") {
    intentKeywords = ["background", "experience", "education", "degree", "worked", "career", "professional", "myself", "introduce", "years", "job", "role"];
  } else if (effectiveIntent === "strengths") {
    intentKeywords = ["strength", "skill", "good at", "excel", "expert", "proficient", "strong", "best at", "ability", "capable", "knowledge"];
  } else if (effectiveIntent === "achievement") {
    intentKeywords = ["achieved", "completed", "delivered", "won", "accomplished", "success", "result", "proud", "award", "recognized", "milestone"];
  } else if (effectiveIntent === "challenge") {
    intentKeywords = ["challenge", "problem", "difficult", "issue", "obstacle", "solved", "resolved", "faced", "overcame", "tackled", "handled"];
  } else if (effectiveIntent === "motivation") {
    intentKeywords = ["interested", "motivated", "passionate", "career", "goal", "fit", "align", "want", "looking", "excited", "aspire", "growth"];
  } else if (effectiveIntent === "teamwork") {
    intentKeywords = ["team", "collaborate", "together", "group", "colleague", "partner", "shared", "worked with", "cooperate", "support"];
  } else if (effectiveIntent === "project") {
    intentKeywords = ["project", "built", "developed", "created", "designed", "implemented", "launched", "worked on", "application", "system"];
  } else if (effectiveIntent === "experience") {
    intentKeywords = ["experience", "worked", "role", "position", "responsibility", "task", "job", "previous", "internship", "employed"];
  }

  // Count intent keyword matches
  intentKeywords.forEach(keyword => {
    if (lower.includes(keyword)) intentMatchScore += 12;
  });

  // 2. Specific entity checks
  if (effectiveIntent === "about" && hasBackground) intentMatchScore += 15;
  if (effectiveIntent === "strengths" && skillCount > 0) intentMatchScore += 15;
  if (effectiveIntent === "achievement" && resultCount > 0) intentMatchScore += 15;
  if (effectiveIntent === "challenge" && hasChallenge) intentMatchScore += 15;
  if (effectiveIntent === "motivation" && (reasonCount > 0 || hasConnection)) intentMatchScore += 15;
  if (effectiveIntent === "teamwork" && firstPersonCount > 1) intentMatchScore += 10;
  if (effectiveIntent === "project" && actionCount > 0) intentMatchScore += 15;
  if (effectiveIntent === "experience" && hasBackground) intentMatchScore += 15;

  // 3. First person bonus
  let firstPersonBonus = 0;
  if (firstPersonCount >= 4) firstPersonBonus = 12;
  else if (firstPersonCount >= 2) firstPersonBonus = 6;
  else if (firstPersonCount >= 1) firstPersonBonus = 3;

  // 4. Action verb bonus
  let actionBonus = 0;
  if (actionCount >= 3) actionBonus = 15;
  else if (actionCount >= 2) actionBonus = 10;
  else if (actionCount >= 1) actionBonus = 5;

  // 5. Example bonus
  let exampleBonus = 0;
  if (exampleCount >= 2) exampleBonus = 12;
  else if (exampleCount >= 1) exampleBonus = 6;

  // 6. Word count bonus
  let wordBonus = 0;
  if (words >= 50) wordBonus = 25;
  else if (words >= 35) wordBonus = 20;
  else if (words >= 25) wordBonus = 15;
  else if (words >= 18) wordBonus = 10;
  else if (words >= 12) wordBonus = 6;
  else if (words >= 8) wordBonus = 3;
  else if (words >= 5) wordBonus = 1;

  // 7. Question overlap bonus
  const overlapBonus = Math.min(20, Math.round(overlapRatio * 25));

  // Calculate base score
  let totalScore = 15 + // Base score for attempting
    wordBonus +
    overlapBonus +
    intentMatchScore +
    firstPersonBonus +
    actionBonus +
    exampleBonus;

  // Penalties for off-topic or generic answers
  if (intentMatchScore < 10 && words > 10) {
    totalScore -= 15;
  }

  if (genericStatements >= 2) {
    totalScore -= 10;
  }

  if (vagueCount >= 3) {
    totalScore -= 10;
  }

  // Short answer penalty
  if (words < 5) {
    totalScore -= 20;
  } else if (words < 8) {
    totalScore -= 12;
  } else if (words < 12) {
    totalScore -= 5;
  }

  // Penalty for non-English/Hindi responses that don't answer the question
  if (text.match(/[^\x00-\x7F]/g) && intentMatchScore < 10) {
    totalScore -= 15;
  }

  // Ensure score is between 1 and 100
  const answerScore = clamp(Math.round(totalScore), 1, 100);

  // ============================================================
  // CLARITY SCORE
  // ============================================================
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const averageSentenceLength =
    sentences.length > 0
      ? words / sentences.length
      : words;

  let clarityScore = 75;

  if (averageSentenceLength > 35) clarityScore -= 15;
  if (averageSentenceLength > 45) clarityScore -= 10;
  if (sentences.length === 1 && words > 45) clarityScore -= 10;
  if (words < 5) clarityScore -= 30;
  if (words < 10) clarityScore -= 20;
  if (words >= 15 && words <= 180) clarityScore += 10;

  const wordList = lower
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const frequency = {};

  wordList.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  const repeatedWords = Object.entries(frequency)
    .filter(([word, count]) =>
      count >= 5 &&
      word.length > 4 &&
      ![
        "about",
        "because",
        "would",
        "could",
        "there",
        "which",
        "their",
        "really"
      ].includes(word)
    );

  if (repeatedWords.length >= 2) {
    clarityScore -= 10;
  }

  clarityScore = clamp(clarityScore);

  // ============================================================
  // CONCISENESS SCORE
  // ============================================================
  let concisenessScore = 85;

  if (words < 5) {
    concisenessScore = 40;
  } else if (words < 10) {
    concisenessScore = 55;
  } else if (words < 15) {
    concisenessScore = 70;
  } else if (words <= 180) {
    concisenessScore = 90;
  } else if (words <= 250) {
    concisenessScore = 80;
  } else if (words <= 350) {
    concisenessScore = 65;
  } else {
    concisenessScore = 50;
  }

  // ============================================================
  // CONFIDENCE SCORE
  // ============================================================
  let confidenceScore = 55;

  if (firstPersonCount >= 2) confidenceScore += 10;
  if (actionCount >= 1) confidenceScore += 10;
  if (
    hasAny(
      "i led",
      "i built",
      "i developed",
      "i managed",
      "i solved",
      "i implemented",
      "i achieved",
      "i delivered"
    )
  ) {
    confidenceScore += 10;
  }
  if (hasNumber || hasPercentage) confidenceScore += 5;
  if (words > 15) confidenceScore += 5;
  if (
    hasAny(
      "maybe",
      "probably",
      "i think",
      "i guess",
      "sort of",
      "kind of",
      "perhaps"
    )
  ) {
    confidenceScore -= 10;
  }
  if (vagueCount >= 3) confidenceScore -= 10;

  confidenceScore = clamp(confidenceScore);

  // ============================================================
  // DETERMINE IF ANSWER IS ON TOPIC
  // ============================================================
  const isOnTopic = (
    (overlapRatio > 0.2 || intentMatchScore > 15) ||
    (effectiveIntent === "about" && hasBackground) ||
    (effectiveIntent === "strengths" && skillCount > 0) ||
    (effectiveIntent === "achievement" && (resultCount > 0 || actionCount > 0)) ||
    (effectiveIntent === "challenge" && hasChallenge) ||
    (effectiveIntent === "motivation" && (reasonCount > 0 || hasConnection)) ||
    words > 20
  );

  const answerOnTopic = isOnTopic;

  // ============================================================
  // BUILD STRENGTHS
  // ============================================================
  const strengths = [];

  if (isOnTopic && answerScore >= 70) {
    strengths.push("You answered the question directly and provided relevant information.");
  }

  if (words >= 30 && isOnTopic) {
    strengths.push("You provided a detailed and comprehensive answer.");
  }

  if (actionCount >= 2) {
    strengths.push("You used strong action verbs that demonstrate your contributions.");
  }

  if (specificityScore >= 70) {
    strengths.push("You used specific details that made your answer more credible.");
  }

  if (firstPersonCount >= 3) {
    strengths.push("You clearly explained your personal contribution.");
  }

  if (resultCount >= 1) {
    strengths.push("You explained the result or impact of your actions.");
  }

  if (answerOnTopic && words > 10) {
    strengths.push("You addressed the question with a relevant response.");
  }

  if (intentMatchScore > 30) {
    strengths.push("Your answer shows good understanding of what the interviewer is asking.");
  }

  // ============================================================
  // BUILD IMPROVEMENTS
  // ============================================================
  const improvements = [];

  if (!isOnTopic) {
    improvements.push("Your answer does not directly address the question. Focus on what the interviewer asked.");
  }

  if (words < 15) {
    improvements.push("Provide more detail in your answer. Expand on your experience with specific examples.");
  }

  if (actionCount < 1) {
    improvements.push("Use action verbs like 'developed', 'built', 'managed', or 'solved' to describe your contributions.");
  }

  if (firstPersonCount < 2) {
    improvements.push("Make your personal contribution clearer by using 'I' and 'my' statements.");
  }

  if (vagueCount >= 2) {
    improvements.push("Avoid generic phrases. Replace them with specific examples and measurable results.");
  }

  if (specificityScore < 50) {
    improvements.push("Add specific numbers, technologies, or examples to make your answer more credible.");
  }

  if (answerScore >= 50 && answerScore < 70) {
    improvements.push("Your answer is on the right track. Add more specific examples and explain your results.");
  }

  // Intent-specific improvements
  if (effectiveIntent === "about") {
    if (!hasBackground) {
      improvements.push("Briefly introduce your education, experience, or professional background.");
    }
    if (skillCount === 0) {
      improvements.push("Mention 2–3 skills that are relevant to the position.");
    }
    if (!hasConnection) {
      improvements.push("End by connecting your background and skills to the role.");
    }
  } else if (effectiveIntent === "strengths") {
    if (skillCount === 0) {
      improvements.push("Clearly identify your strongest professional qualities.");
    }
    if (actionCount === 0 && exampleCount === 0) {
      improvements.push("Prove your strengths with a real example rather than simply listing them.");
    }
  } else if (effectiveIntent === "achievement") {
    if (actionCount === 0) {
      improvements.push("Focus on the actions you personally took to achieve the result.");
    }
    if (resultCount === 0) {
      improvements.push("State the outcome clearly and use a measurable result where possible.");
    }
  } else if (effectiveIntent === "challenge") {
    if (!hasChallenge) {
      improvements.push("Clearly explain what made the situation difficult.");
    }
    if (resultCount === 0) {
      improvements.push("Explain how the situation ended and what changed because of your actions.");
    }
  } else if (effectiveIntent === "motivation") {
    if (reasonCount === 0) {
      improvements.push("Give a specific reason for your interest instead of using only general statements.");
    }
    if (!hasConnection) {
      improvements.push("Explain why this particular role or company fits your goals.");
    }
  } else if (effectiveIntent === "teamwork") {
    if (actionCount === 0) {
      improvements.push("Explain what you personally contributed to the team.");
    }
  } else if (effectiveIntent === "project") {
    if (actionCount === 0) {
      improvements.push("Explain your specific contribution to the project.");
    }
  } else if (effectiveIntent === "experience") {
    if (actionCount === 0) {
      improvements.push("Explain what you personally did in the experience you mentioned.");
    }
  }

  // ============================================================
  // DETAILED FEEDBACK
  // ============================================================
  let detailedFeedback;

  if (answerScore >= 85) {
    detailedFeedback =
      "Excellent answer! You directly addressed the question, provided specific examples, clearly explained your personal contribution, and demonstrated strong communication skills.";
  } else if (answerScore >= 70) {
    detailedFeedback =
      "Good answer. You addressed the main requirement of the question and provided relevant supporting information. Adding more specific details or a clearer result could make it even stronger.";
  } else if (answerScore >= 50) {
    detailedFeedback =
      "Your answer is somewhat relevant but needs improvement. Provide more specific examples, clearly explain what you personally did, and finish with the result or impact.";
  } else if (answerScore >= 30) {
    detailedFeedback =
      "Your answer is brief and lacks sufficient detail. Expand your response with specific examples, explain your actions, and describe the results. This will demonstrate your qualifications more effectively.";
  } else {
    detailedFeedback =
      "Your answer needs significant improvement. Focus first on directly answering the question, then give one relevant example and explain what you personally did and what happened as a result.";
  }

  // Full marks guide
  const fullMarksGuide = getFullMarksGuide(effectiveIntent, questionText, jobRole);

  return {
    answerScore,
    relevanceScore: Math.min(100, Math.round(intentMatchScore + overlapBonus + 15)),
    clarityScore,
    completenessScore: Math.min(100, Math.round(wordBonus + overlapBonus + 20)),
    communicationScore: clamp(Math.round((clarityScore + concisenessScore + confidenceScore) / 3)),
    confidenceScore,
    strengths: strengths.length ? unique(strengths).slice(0, 3) : ["You provided a response to the interview question."],
    improvements: unique(improvements).slice(0, 4),
    detailedFeedback,
    fullMarksGuide,
    answerOnTopic
  };
}

function getIntentImprovements(
  intent,
  criteria,
  signals
) {
  const improvements = [];

  const {
    hasBackground,
    skillCount,
    actionCount,
    resultCount,
    exampleCount,
    hasConnection,
    hasChallenge
  } = signals;

  if (intent === "about") {
    if (!hasBackground) {
      improvements.push(
        "Briefly introduce your education, experience, or professional background."
      );
    }
    if (skillCount === 0) {
      improvements.push(
        "Mention 2–3 skills that are relevant to the position."
      );
    }
    if (exampleCount === 0 && actionCount === 0) {
      improvements.push(
        "Include one concrete project, internship, job, or experience."
      );
    }
    if (!hasConnection) {
      improvements.push(
        "End by connecting your background and skills to the role."
      );
    }
  } else if (intent === "strengths") {
    if (skillCount === 0) {
      improvements.push(
        "Clearly identify your strongest professional qualities."
      );
    }
    if (actionCount === 0 && exampleCount === 0) {
      improvements.push(
        "Prove your strengths with a real example rather than simply listing them."
      );
    }
    if (resultCount === 0) {
      improvements.push(
        "Explain what positive result your strengths helped you achieve."
      );
    }
  } else if (intent === "achievement") {
    if (actionCount === 0) {
      improvements.push(
        "Focus on the actions you personally took to achieve the result."
      );
    }
    if (resultCount === 0) {
      improvements.push(
        "State the outcome clearly and use a measurable result where possible."
      );
    }
  } else if (intent === "challenge") {
    if (!hasChallenge) {
      improvements.push(
        "Clearly explain what made the situation difficult."
      );
    }
    if (actionCount === 0) {
      improvements.push(
        "Describe the specific steps you personally took to solve the problem."
      );
    }
    if (resultCount === 0) {
      improvements.push(
        "Explain how the situation ended and what changed because of your actions."
      );
    }
  } else if (intent === "project") {
    if (actionCount === 0) {
      improvements.push(
        "Explain your specific contribution to the project."
      );
    }
    if (skillCount === 0) {
      improvements.push(
        "Mention the main technologies or skills you used."
      );
    }
    if (resultCount === 0) {
      improvements.push(
        "Explain what the project achieved or what you learned from it."
      );
    }
  } else if (intent === "motivation") {
    if (criteria.reasoning < 60) {
      improvements.push(
        "Give a specific reason for your interest instead of using only general career statements."
      );
    }
    if (!hasConnection) {
      improvements.push(
        "Explain why this particular role or company fits your goals."
      );
    }
  } else if (intent === "teamwork") {
    if (actionCount === 0) {
      improvements.push(
        "Explain what you personally contributed to the team."
      );
    }
    if (resultCount === 0) {
      improvements.push(
        "Describe the outcome of the team's work."
      );
    }
  } else if (intent === "experience") {
    if (actionCount === 0) {
      improvements.push(
        "Explain what you personally did in the experience you mentioned."
      );
    }
    if (skillCount === 0) {
      improvements.push(
        "Mention the relevant skills you used."
      );
    }
    if (resultCount === 0) {
      improvements.push(
        "Include the result or impact of your work."
      );
    }
  }

  return improvements;
}

function getFullMarksGuide(
  intent,
  question,
  jobRole = ""
) {
  const role = normalizeText(jobRole) || "this role";

  switch (intent) {
    case "about":
      return `For full marks, briefly introduce yourself, explain your education or professional background, mention 2–3 skills relevant to ${role}, give one specific project or experience, explain what you personally contributed, and finish by clearly connecting your background to ${role}.`;
    case "strengths":
      return "For full marks, mention 2–3 strengths, give a real example for each important strength, explain what you personally did, describe the result, and connect those strengths to the requirements of the role.";
    case "achievement":
      return "For full marks, choose one important achievement, explain the situation, describe exactly what you personally did, explain the result or impact, and finish with what the achievement demonstrates about you.";
    case "challenge":
      return "For full marks, explain the difficult situation, clearly describe the problem, explain the actions you personally took to solve it, give the result, and mention what you learned from the experience.";
    case "project":
      return "For full marks, introduce the project, explain its purpose, describe your exact contribution, mention the important skills or technologies you used, explain the result, and state what you learned or achieved.";
    case "motivation":
      return `For full marks, explain why you are interested in ${role}, connect your skills and experience to the role, explain why the position fits your career goals, and give a clear reason why you would be a good fit.`;
    case "teamwork":
      return "For full marks, describe one specific team situation, explain your responsibility, describe what you personally did, explain how you handled the team situation, give the result, and mention what you learned.";
    case "experience":
      return `For full marks, choose one experience that directly relates to ${role}, explain the situation, describe your responsibilities and personal contribution, mention the skills you used, explain the result, and clearly connect that experience to the role.`;
    default:
      return `For full marks, answer the question directly, give one specific example, explain what you personally did, describe the result or impact, and connect your answer back to the question.`;
  }
}

/*
|--------------------------------------------------------------------------
| INTERVIEW REPORT COMPONENT - FIXED
|--------------------------------------------------------------------------
*/

function InterviewReport({
  report,
  onRetry,
  onBack,
}) {
  if (!report) {
    return (
      <div className="card mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-white">
          Interview Result
        </h1>
        <p className="mt-3 text-gray-400">
          No interview report is available.
        </p>
        <button
          onClick={onRetry}
          className="mt-6 rounded bg-purple-600 px-5 py-3 font-semibold text-white"
        >
          Start Again
        </button>
      </div>
    );
  }

  const safeArray = (value) => {
    return Array.isArray(value) ? value : [];
  };

  return (
    <div className="card mx-auto max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white">
          AI Mock Interview Result
        </h1>
        <p className="mt-2 text-gray-400">
          Your interview has been completed.
        </p>
        {report.jobRole && (
          <p className="mt-2 text-sm text-purple-300">
            Role: {report.jobRole}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 to-slate-900 p-6">
        <p className="text-sm uppercase tracking-wider text-gray-400">
          Final Interview Score
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <span className="text-6xl font-bold text-white">
            {report.overallScore}
          </span>
          <span className="pb-2 text-xl text-gray-400">
            /100
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          Your final score is calculated from answer
          quality, relevance, communication, speaking
          and presentation.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Overall", report.overallScore],
          ["Answer Quality", report.answerQualityScore],
          ["Communication", report.communicationScore],
          ["Relevance", report.relevanceScore],
          ["Speaking", report.speakingScore],
          ["Presentation", report.presentationScore],
        ].map(([label, score]) => (
          <div
            key={label}
            className="rounded-xl border border-purple-500/10 bg-slate-900 p-5"
          >
            <div className="text-sm text-gray-400">
              {label}
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {score}/100
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-purple-500/10 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-white">
          Face & Presentation
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-400">Face detected</p>
            <p className="mt-1 text-xl font-semibold text-purple-300">
              {report.faceDetectedPercentage}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Looking toward camera</p>
            <p className="mt-1 text-xl font-semibold text-purple-300">
              {report.lookingAtCameraPercentage}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Face movement</p>
            <p className="mt-1 text-xl font-semibold text-purple-300">
              {report.faceMovementScore > 60
                ? "High"
                : report.faceMovementScore > 25
                ? "Moderate"
                : "Low"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-purple-500/10 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-white">
          Speaking
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-400">Total speaking time</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {report.totalSpeakingTime}s
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Average answer duration</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {report.averageAnswerDuration}s
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Speaking pace</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {report.averageSpeakingPace} WPM
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Long pauses</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {report.longPauses}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-white">
          Question Results
        </h2>
        <div className="mt-3 space-y-3">
          {report.questions.map((item, index) => {
            const strengths = safeArray(item.feedback?.strengths);
            const improvements = safeArray(item.feedback?.improvements);

            return (
              <div
                key={item.questionId || index}
                className="rounded-xl border border-purple-500/10 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-gray-200">
                      {item.question}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-lg font-semibold text-purple-300">
                    {item.answerScore}/100
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-400">Your answer</p>
                  <p className="mt-1 text-sm leading-6 text-gray-300">
                    {item.transcript || "No transcript available."}
                  </p>
                </div>

                {item.feedback?.detailedFeedback && (
                  <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <p className="text-sm font-semibold text-yellow-300">
                      Interviewer Feedback
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {item.feedback.detailedFeedback}
                    </p>
                  </div>
                )}

                {item.feedback?.fullMarksGuide && (
                  <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
                    <p className="text-sm font-semibold text-purple-300">
                      How to Get Full Marks
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {item.feedback.fullMarksGuide}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-sm font-medium text-green-300">
                    Strengths
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-gray-400">
                    {strengths.map((strength, strengthIndex) => (
                      <li key={strengthIndex}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-yellow-300">
                    Improvements
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-gray-400">
                    {improvements.map((improvement, improvementIndex) => (
                      <li key={improvementIndex}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onRetry}
          className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 font-semibold text-white"
        >
          Retry Interview
        </button>
        <button
          onClick={onBack}
          className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT - DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default function AIMockInterview() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const faceTimerRef = useRef(null);
  const metricsTimerRef = useRef(null);
  const answerStartedRef = useRef(0);
  const lastSpeechRef = useRef(0);
  const finalSpeechRef = useRef("");
  const transcriptRef = useRef("");
  const recordsRef = useRef([]);
  const faceSamplesRef = useRef([]);
  const speechSamplesRef = useRef([]);
  const finishingRef = useRef(false);
  const phaseRef = useRef("setup");
  const questionIndexRef = useRef(0);
  const questionsRef = useRef(DEFAULT_QUESTIONS);
  const finishAnswerRef = useRef(null);
  const faceModelsLoadedRef = useRef(false);
  const initializingRef = useRef(false);
  const recognitionRestartTimerRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);

  const profile = useMemo(() => getInterviewProfile(), []);

  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [phase, setPhase] = useState("setup");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [faceStatus, setFaceStatus] = useState("Not started");
  const [speaking, setSpeaking] = useState(false);
  const [micStatus, setMicStatus] = useState("Inactive");
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const generateInterviewQuestions = useCallback(async () => {
    const { resume, jobRole } = getInterviewProfile();
    const fallback = buildFallbackQuestions(resume, jobRole);

    setQuestions(fallback);
    questionsRef.current = fallback;

    try {
      setQuestionsLoading(true);

      const token = localStorage.getItem("authToken") || "";
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 7000);

      const response = await fetch(
        "/api/interview/generate-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
          body: JSON.stringify({
            resume,
            jobRole,
            requirements: {
              resumeBased: true,
              jobRoleBased: true,
              behavioral: true,
              technical: true,
              experienceBased: true,
              totalQuestions: 6,
            },
          }),
        }
      );

      window.clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const generated = data?.questions || data?.data?.questions;

        if (Array.isArray(generated) && generated.length > 0) {
          const cleaned = generated
            .map((item, index) => {
              if (typeof item === "string") {
                return {
                  questionId: `dynamic-${index}`,
                  question: item,
                };
              }
              return {
                questionId: item.questionId || `dynamic-${index}`,
                question: item.question || item.text || "",
              };
            })
            .filter((item) => item.question)
            .slice(0, 8);

          if (cleaned.length) {
            setQuestions(cleaned);
            questionsRef.current = cleaned;
          }
        }
      }
    } catch (generationError) {
      console.warn("Dynamic question generation unavailable:", generationError);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRestartTimerRef.current) {
      window.clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }

    const recognition = recognitionRef.current;

    if (recognition) {
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setMicStatus("Inactive");
    setSpeaking(false);
  }, []);

  const stopInterviewMedia = useCallback(() => {
    stopRecognition();

    if (faceTimerRef.current) {
      window.clearInterval(faceTimerRef.current);
      faceTimerRef.current = null;
    }

    if (metricsTimerRef.current) {
      window.clearInterval(metricsTimerRef.current);
      metricsTimerRef.current = null;
    }

    releaseMedia(streamRef.current, audioContextRef.current);
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }
  }, [stopRecognition]);

  useEffect(() => {
    return () => {
      stopInterviewMedia();
    };
  }, [stopInterviewMedia]);

  // ============================================================
  // FIXED: startRecognition - Instant typing
  // ============================================================
  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      setMicStatus("Unavailable");
      return false;
    }

    if (isMuted) {
      setMicStatus("Muted");
      return false;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("✅ Speech recognition started");
      setMicStatus("Active");
      setError("");
    };

    recognition.onresult = (event) => {
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";

        if (result.isFinal) {
          if (text.trim()) {
            finalSpeechRef.current = normalizeText(`${finalSpeechRef.current} ${text}`);
          }
          lastSpeechRef.current = Date.now();
        } else {
          if (text.trim()) {
            currentInterim = normalizeText(`${currentInterim} ${text}`);
          }
          lastSpeechRef.current = Date.now();
        }
      }

      const liveText = normalizeText(`${finalSpeechRef.current} ${currentInterim}`);
      transcriptRef.current = liveText;
      setTranscript(liveText);
      setInterim(currentInterim);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);

      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      if (event.error === "audio-capture") {
        setError("Microphone could not capture audio. Please check your microphone.");
      } else if (event.error === "not-allowed") {
        setError("Microphone permission was denied. Please allow microphone access.");
      } else {
        setError(`Speech recognition error: ${event.error}.`);
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      if (phaseRef.current === "running" && !finishingRef.current && !isMuted) {
        recognitionRestartTimerRef.current = window.setTimeout(() => {
          if (phaseRef.current !== "running" || finishingRef.current || isMuted) {
            return;
          }
          try {
            recognition.start();
          } catch (err) {
            console.warn("Failed to restart recognition:", err);
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      return true;
    } catch (startError) {
      console.error("Could not start speech recognition:", startError);
      setMicStatus("Unavailable");
      setError("Could not start speech recognition. Please allow microphone access and use Chrome or Edge.");
      return false;
    }
  }, [isMuted]);

  // ============================================================
  // FIXED: toggleMute
  // ============================================================
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (newMutedState) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (err) {
          console.warn("Error stopping recognition:", err);
        }
        recognitionRef.current = null;
      }
      setMicStatus("Muted");
      setSpeaking(false);
    } else {
      setMicStatus("Starting...");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setTimeout(() => {
        if (phaseRef.current === "running") {
          startRecognition();
        }
      }, 50);
    }
  }, [isMuted, startRecognition]);

  // ============================================================
  // FIXED: loadFaceModels
  // ============================================================
  const loadFaceModels = useCallback(async () => {
    if (faceModelsLoadedRef.current) {
      return true;
    }

    setFaceStatus("Loading face models...");

    const modelSources = [
      "/models",
      window.location.origin + "/models",
      "https://justadudewhohacks.github.io/face-api.js/models",
      "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights"
    ];

    for (const source of modelSources) {
      try {
        console.log(`Attempting to load models from: ${source}`);
        await faceapi.nets.tinyFaceDetector.load(source);
        await faceapi.nets.faceLandmark68Net.load(source);
        
        faceModelsLoadedRef.current = true;
        console.log(`✅ Face detection models loaded successfully from: ${source}`);
        setFaceStatus("✅ Models loaded - detecting face");
        return true;
      } catch (error) {
        console.warn(`❌ Failed to load from ${source}:`, error.message);
      }
    }

    setFaceStatus("❌ Unavailable - models not found");
    return false;
  }, []);

  // ============================================================
  // FIXED: startFaceMonitoring
  // ============================================================
  const startFaceMonitoring = useCallback(() => {
    if (!faceModelsLoadedRef.current) {
      setFaceStatus("❌ Unavailable");
      return;
    }

    if (faceTimerRef.current) {
      window.clearInterval(faceTimerRef.current);
    }

    setFaceStatus("🔍 Detecting face...");

    faceTimerRef.current = window.setInterval(async () => {
      const video = videoRef.current;

      if (!video) {
        setFaceStatus("⏳ Waiting for video...");
        return;
      }

      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        setFaceStatus("⏳ Waiting for camera...");
        return;
      }

      try {
        const result = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 160,
              scoreThreshold: 0.45,
            })
          )
          .withFaceLandmarks();

        const box = result?.detection?.box;
        const faceCenterX = box ? box.x + box.width / 2 : 0;
        const videoCenterX = video.videoWidth / 2;
        const looking = Boolean(box) && Math.abs(faceCenterX - videoCenterX) < video.videoWidth * 0.18;

        faceSamplesRef.current.push({
          detected: Boolean(result),
          looking,
          x: faceCenterX,
        });

        faceSamplesRef.current = faceSamplesRef.current.slice(-600);

        if (!result) {
          setFaceStatus("👤 No face detected");
        } else if (looking) {
          setFaceStatus("✅ Face detected - toward camera");
        } else {
          setFaceStatus("👤 Face detected - looking away");
        }
      } catch (error) {
        console.warn("Face detection error:", error);
        setFaceStatus("⚠️ Error detecting face");
      }
    }, 500);
  }, []);

  const startAudioMonitoring = useCallback((analyser) => {
    if (!analyser) return;

    if (metricsTimerRef.current) {
      window.clearInterval(metricsTimerRef.current);
    }

    const data = new Uint8Array(analyser.fftSize);

    metricsTimerRef.current = window.setInterval(() => {
      try {
        analyser.getByteTimeDomainData(data);

        const rms = Math.sqrt(
          data.reduce((sum, value) => sum + (value - 128) ** 2, 0) / data.length
        );

        const active = rms > 7;

        speechSamplesRef.current.push(active);
        speechSamplesRef.current = speechSamplesRef.current.slice(-1200);

        setSpeaking(active);

        if (active) {
          lastSpeechRef.current = Date.now();
        }

        if (
          !isMuted &&
          transcriptRef.current.trim() &&
          Date.now() - lastSpeechRef.current > SILENCE_MS &&
          Date.now() - answerStartedRef.current > MIN_ANSWER_MS &&
          !finishingRef.current
        ) {
          finishAnswerRef.current?.();
        }
      } catch (error) {
        console.warn("Audio monitoring error:", error);
      }
    }, 80);
  }, [isMuted]);

  const buildReport = useCallback(
    (records) => {
      if (!records.length) {
        return {
          overallScore: 0,
          answerQualityScore: 0,
          communicationScore: 0,
          relevanceScore: 0,
          speakingScore: 0,
          presentationScore: 0,
          questions: [],
          faceDetectedPercentage: 0,
          lookingAtCameraPercentage: 0,
          faceMovementScore: 0,
          totalSpeakingTime: 0,
          averageAnswerDuration: 0,
          averageSpeakingPace: 0,
          longPauses: 0,
          jobRole: profile.jobRole || "",
        };
      }

      const answerQualityScore = average(
        records.map((record) => record.answerScore)
      );

      const communicationScore = average(
        records.map((record) => record.feedback?.communicationScore || record.answerScore)
      );

      const relevanceScore = average(
        records.map((record) => record.feedback?.relevanceScore || record.answerScore)
      );

      const speakingScore = average(
        records.map((record) => {
          if (!record.speakingDetected) {
            return 50;
          }
          const pace = record.speakingPace;
          if (pace >= 120 && pace <= 170) {
            return 100;
          }
          if (pace >= 90 && pace <= 200) {
            return 85;
          }
          return 70;
        })
      );

      const presentationScore = average(
        records.map((record) =>
          Math.round((record.faceDetectedPercentage + record.lookingAtCameraPercentage) / 2)
        )
      );

      const overallScore = Math.round(
        answerQualityScore * 0.5 +
          communicationScore * 0.2 +
          relevanceScore * 0.15 +
          speakingScore * 0.075 +
          presentationScore * 0.075
      );

      return {
        overallScore,
        answerQualityScore,
        communicationScore,
        relevanceScore,
        speakingScore,
        presentationScore,
        questions: records,
        faceDetectedPercentage: average(
          records.map((record) => record.faceDetectedPercentage)
        ),
        lookingAtCameraPercentage: average(
          records.map((record) => record.lookingAtCameraPercentage)
        ),
        faceMovementScore: average(
          records.map((record) => record.faceMovementScore)
        ),
        totalSpeakingTime: records.reduce(
          (sum, record) => sum + record.answerDuration,
          0
        ),
        averageAnswerDuration: average(
          records.map((record) => record.answerDuration)
        ),
        averageSpeakingPace: average(
          records.map((record) => record.speakingPace)
        ),
        longPauses: records.filter(
          (record) => record.pauseDuration > SILENCE_MS
        ).length,
        jobRole: profile.jobRole || "",
      };
    },
    [profile.jobRole]
  );

  const finishAnswer = useCallback(async () => {
    if (finishingRef.current || phaseRef.current !== "running") {
      return;
    }

    const answer = normalizeText(transcriptRef.current);

    if (!answer) {
      setError("Please speak an answer before finishing.");
      return;
    }

    const elapsed = Date.now() - answerStartedRef.current;

    if (elapsed < MIN_ANSWER_MS) {
      return;
    }

    finishingRef.current = true;
    stopRecognition();
    setProcessing(true);
    setError("");

    const duration = Math.max(1, Math.round(elapsed / 1000));
    const faceSamples = [...faceSamplesRef.current];
    const speechSamples = [...speechSamplesRef.current];
    const currentQuestion = questionsRef.current[questionIndexRef.current];

    if (!currentQuestion) {
      setProcessing(false);
      finishingRef.current = false;
      return;
    }

    let evaluation = localEvaluateAnswer(
      answer,
      currentQuestion.question,
      profile.resume,
      profile.jobRole
    );

    try {
      const token = localStorage.getItem("authToken") || "";
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        "/api/interview/analyze-answer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
          body: JSON.stringify({
            question: currentQuestion.question,
            answer,
            answerDuration: duration,
            wordCount: wordCount(answer),
            jobRole: profile.jobRole,
            resume: profile.resume,
            evaluationRules: {
              evaluateMeaning: true,
              evaluateQuestionIntent: true,
              ignoreKeywordMatching: true,
              doNotGiveHighScoreForRepeatedQuestionWords: true,
              checkDirectRelevance: true,
              checkCompleteness: true,
              explainMissingParts: true,
              provideFullMarksGuidance: true,
            },
          }),
        }
      );

      window.clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data?.evaluation) {
          evaluation = { ...evaluation, ...data.evaluation };
        }
      }
    } catch (evaluationError) {
      console.warn("AI evaluation unavailable, using local evaluation:", evaluationError);
    }

    const words = wordCount(answer);
    const speakingPace = duration > 0 ? Math.round(words / (duration / 60)) : 0;
    const speakingDetected = speechSamples.some(Boolean);

    const faceDetectedPercentage = faceSamples.length
      ? Math.round(
          (faceSamples.filter((sample) => sample.detected).length / faceSamples.length) * 100
        )
      : 0;

    const lookingAtCameraPercentage = faceSamples.length
      ? Math.round(
          (faceSamples.filter((sample) => sample.looking).length / faceSamples.length) * 100
        )
      : 0;

    let movementTotal = 0;

    for (let index = 1; index < faceSamples.length; index += 1) {
      movementTotal += Math.abs(
        Number(faceSamples[index].x || 0) - Number(faceSamples[index - 1].x || 0)
      );
    }

    const faceMovementScore = faceSamples.length > 1
      ? Math.min(100, Math.round((movementTotal / faceSamples.length) * 100))
      : 0;

    const speakingSampleCount = speechSamples.filter(Boolean).length;
    const totalSampleCount = speechSamples.length;
    const speakingRatio = totalSampleCount ? speakingSampleCount / totalSampleCount : 0;
    const pauseDuration = Math.max(
      0,
      Math.round(duration * 1000 - duration * 1000 * speakingRatio)
    );

    const record = {
      questionId: currentQuestion.questionId,
      question: currentQuestion.question,
      transcript: answer,
      answerDuration: duration,
      wordCount: words,
      speakingDetected,
      speakingPace,
      pauseDuration,
      faceDetectedPercentage,
      lookingAtCameraPercentage,
      faceMovementScore,
      answerScore: Number(evaluation.answerScore) || 0,
      feedback: {
        ...evaluation,
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
      },
    };

    recordsRef.current = [...recordsRef.current, record];
    const updatedRecords = [...recordsRef.current];

    setProcessing(false);

    if (questionIndexRef.current >= questionsRef.current.length - 1) {
      stopInterviewMedia();
      const finalReport = buildReport(updatedRecords);
      setReport(finalReport);
      phaseRef.current = "report";
      setPhase("report");
      setProcessing(false);
      finishingRef.current = false;
      return;
    }

    questionIndexRef.current += 1;
    setQuestionIndex(questionIndexRef.current);

    finalSpeechRef.current = "";
    transcriptRef.current = "";
    setTranscript("");
    setInterim("");

    faceSamplesRef.current = [];
    speechSamplesRef.current = [];

    answerStartedRef.current = Date.now();
    lastSpeechRef.current = Date.now();
    finishingRef.current = false;

    setFaceStatus(faceModelsLoadedRef.current ? "🔍 Detecting face..." : "❌ Unavailable");
    setMicStatus("Starting...");
    setSpeaking(false);

    window.setTimeout(() => {
      if (phaseRef.current === "running") {
        startRecognition();
      }
    }, 80);
  }, [
    buildReport,
    profile.jobRole,
    profile.resume,
    startRecognition,
    stopInterviewMedia,
    stopRecognition,
  ]);

  useEffect(() => {
    finishAnswerRef.current = finishAnswer;
  }, [finishAnswer]);

  useEffect(() => {
    if (phase !== "running") {
      return undefined;
    }

    if (!streamRef.current) {
      return undefined;
    }

    let cancelled = false;

    const initialize = async () => {
      const video = videoRef.current;
      const stream = streamRef.current;

      if (!video || !stream) {
        setError("Unable to initialize camera preview. Please try again.");
        return;
      }

      try {
        video.srcObject = stream;

        await new Promise((resolve) => {
          if (video.readyState >= 1) {
            resolve();
            return;
          }

          const handleMetadata = () => {
            video.removeEventListener("loadedmetadata", handleMetadata);
            resolve();
          };

          video.addEventListener("loadedmetadata", handleMetadata);
        });

        if (cancelled) return;

        await video.play();

        if (cancelled) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error("AUDIO_CONTEXT_UNSUPPORTED");
        }

        const audioContext = new AudioContextClass();

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const faceReady = await loadFaceModels();

        if (cancelled) return;

        if (faceReady) {
          setTimeout(() => {
            if (!cancelled && phaseRef.current === "running") {
              startFaceMonitoring();
            }
          }, 500);
        } else {
          setFaceStatus("❌ Unavailable");
        }

        startAudioMonitoring(analyser);

        const speechStarted = startRecognition();

        if (!speechStarted) {
          setMicStatus("Unavailable");
        }

        answerStartedRef.current = Date.now();
        lastSpeechRef.current = Date.now();

        setFaceStatus(faceReady ? "✅ Models loaded" : "❌ Unavailable");
      } catch (error) {
        console.error("Interview initialization error:", error);

        stopInterviewMedia();

        phaseRef.current = "setup";
        setPhase("setup");

        if (error.message === "AUDIO_CONTEXT_UNSUPPORTED") {
          setError("Your browser does not support microphone analysis. Please use Chrome or Edge.");
        } else {
          setError(error?.message || "Unable to initialize camera and microphone.");
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [
    phase,
    loadFaceModels,
    startFaceMonitoring,
    startAudioMonitoring,
    startRecognition,
    stopInterviewMedia,
  ]);

  const startInterview = async () => {
    if (initializingRef.current) {
      return;
    }

    initializingRef.current = true;
    setError("");
    setIsMuted(false);

    await generateInterviewQuestions();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        "Camera and microphone are not available. Please use Chrome or Edge on localhost or HTTPS."
      );
      initializingRef.current = false;
      return;
    }

    stopInterviewMedia();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      if (!videoTracks.length) {
        releaseMedia(stream);
        throw new Error("NO_CAMERA_TRACK");
      }

      if (!audioTracks.length) {
        releaseMedia(stream);
        throw new Error("NO_MICROPHONE_TRACK");
      }

      streamRef.current = stream;

      recordsRef.current = [];
      faceSamplesRef.current = [];
      speechSamplesRef.current = [];

      finalSpeechRef.current = "";
      transcriptRef.current = "";

      finishingRef.current = false;

      questionIndexRef.current = 0;

      setQuestionIndex(0);
      setTranscript("");
      setInterim("");
      setReport(null);
      setProcessing(false);
      setSpeaking(false);
      setMicStatus("Starting...");
      setFaceStatus("Starting...");

      phaseRef.current = "running";
      setPhase("running");
    } catch (mediaError) {
      console.error("Mock interview media error:", mediaError);

      releaseMedia(streamRef.current);
      streamRef.current = null;

      phaseRef.current = "setup";
      setPhase("setup");

      let message = "Unable to access camera and microphone.";

      switch (mediaError?.name) {
        case "NotAllowedError":
          message =
            "Camera or microphone permission was denied. Please allow both permissions and reload the page.";
          break;
        case "PermissionDeniedError":
          message = "Camera or microphone permission was denied. Please allow both permissions.";
          break;
        case "NotFoundError":
          message = "No camera or microphone was found. Please connect both devices and try again.";
          break;
        case "NotReadableError":
          message =
            "Camera or microphone is already being used by another application. Close Zoom, Teams, Meet, OBS, or another browser tab.";
          break;
        case "OverconstrainedError":
          message = "The selected camera settings are not available. Please try again.";
          break;
        case "SecurityError":
          message = "Camera/microphone access is blocked. Use localhost or HTTPS and allow both permissions.";
          break;
        default:
          if (mediaError?.message === "NO_CAMERA_TRACK") {
            message = "Camera permission was granted, but no camera track was available.";
          } else if (mediaError?.message === "NO_MICROPHONE_TRACK") {
            message = "Microphone permission was granted, but no microphone track was available.";
          } else {
            message = `Unable to start camera/microphone: ${mediaError?.message || "Unknown error"}`;
          }
      }

      setError(message);
    } finally {
      initializingRef.current = false;
    }
  };

  const retryInterview = () => {
    stopInterviewMedia();

    recordsRef.current = [];
    faceSamplesRef.current = [];
    speechSamplesRef.current = [];

    finalSpeechRef.current = "";
    transcriptRef.current = "";

    questionIndexRef.current = 0;
    finishingRef.current = false;

    setIsMuted(false);

    setReport(null);
    setQuestionIndex(0);
    setTranscript("");
    setInterim("");
    setError("");
    setFaceStatus("Not started");
    setMicStatus("Inactive");
    setSpeaking(false);

    phaseRef.current = "setup";
    setPhase("setup");
  };

  if (phase === "setup") {
    return (
      <div className="card mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">
          AI Mock Interview
        </h1>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-900 p-4">
            <span className="text-gray-200">Camera</span>
            <span className="font-medium text-green-400">Required</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-900 p-4">
            <span className="text-gray-200">Microphone</span>
            <span className="font-medium text-green-400">Required</span>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={startInterview}
          disabled={initializingRef.current || questionsLoading}
          className="mt-8 w-full rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {questionsLoading
            ? "Preparing Resume Based Questions..."
            : initializingRef.current
            ? "Starting Camera & Microphone..."
            : "Start Interview"}
        </button>
      </div>
    );
  }

  if (phase === "report") {
    return (
      <InterviewReport
        report={report}
        onRetry={retryInterview}
        onBack={() => navigate("/home")}
      />
    );
  }

  const question = questions[questionIndex] || DEFAULT_QUESTIONS[0];

  return (
    <div className="card mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            AI Mock Interview
          </h1>
          <p className="mt-2 text-gray-400">
            Question {questionIndex + 1} of {questions.length}
          </p>
          {profile.jobRole && (
            <p className="mt-1 text-sm text-purple-300">
              Role: {profile.jobRole}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className={`rounded-full p-2 transition-all ${
              isMuted 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          <span className={`rounded-full px-3 py-1 text-sm ${
            isMuted 
              ? "bg-red-500/10 text-red-400" 
              : "bg-green-500/10 text-green-400"
          }`}>
            {isMuted ? "🔇 Muted" : "🎙️ Active"}
          </span>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all"
          style={{
            width: `${((questionIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-6 rounded-xl border border-purple-500/10 bg-slate-900 p-5">
        <p className="text-xl font-medium leading-8 text-white">
          {question.question}
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-800 p-3 text-center">
              <div className="text-xs text-gray-400">Face</div>
              <strong className={`mt-1 block text-sm ${
                faceStatus.includes("✅") || faceStatus.includes("Detected")
                  ? "text-green-300" 
                  : faceStatus.includes("❌") || faceStatus.includes("Unavailable")
                  ? "text-red-300"
                  : faceStatus.includes("No face")
                  ? "text-yellow-300"
                  : "text-gray-300"
              }`}>
                {faceStatus}
              </strong>
            </div>

            <div className="rounded-lg bg-slate-800 p-3 text-center">
              <div className="text-xs text-gray-400">Speaking</div>
              <strong
                className={`mt-1 block text-sm ${
                  speaking ? "text-green-300" : "text-gray-300"
                }`}
              >
                {speaking ? "Yes" : "No"}
              </strong>
            </div>

            <div className="rounded-lg bg-slate-800 p-3 text-center">
              <div className="text-xs text-gray-400">Microphone</div>
              <strong className={`mt-1 block text-sm ${
                isMuted ? "text-red-300" : "text-green-300"
              }`}>
                {isMuted ? "🔇 Muted" : micStatus}
              </strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/10 bg-slate-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Live Transcript
          </h2>

          <div className="mt-4 min-h-48 rounded-lg bg-slate-950 p-4">
            {transcript ? (
              <p className="leading-7 text-gray-200">
                {transcript}
              </p>
            ) : (
              <p className="text-gray-500">
                {isMuted ? "🔇 Microphone is muted. Click the mic button to unmute." : "Start speaking to answer..."}
              </p>
            )}
          </div>

          {interim && !isMuted && (
            <div className="mt-2 text-xs text-gray-500">
              Listening...
            </div>
          )}

          {isMuted && (
            <div className="mt-2 text-xs text-red-400">
              🔇 Microphone is muted - click the mic button to speak
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={finishAnswer}
            disabled={!transcript.trim() || processing || isMuted}
            className="mt-5 w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {processing
              ? "Evaluating Answer..."
              : questionIndex === questions.length - 1
              ? "Finish Interview & View Score"
              : "Finish Answer"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            {isMuted 
              ? "🔇 Unmute your microphone to speak" 
              : "When you stop speaking, the answer can be completed automatically."}
          </p>
        </div>
      </div>
    </div>
  );
}
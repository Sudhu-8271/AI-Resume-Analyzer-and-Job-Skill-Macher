const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "openai/gpt-oss-20b";

/* =========================================================
   MAIN RESUME / ATS ANALYSIS
========================================================= */

async function analyzeWithAI(data) {
  try {
    const {
      resumeText = "",
      jobDescription = "",
      matchScore = 0,
      matchedSkills = [],
      missingSkills = [],
      resumeSkills = [],
      jdSkills = [],
    } = data;

    const prompt = `
You are an Expert ATS Resume Analyzer.

IMPORTANT RULES:
1. NEVER calculate your own match score.
2. ALWAYS use the provided Match Score.
3. NEVER invent skills.
4. NEVER add skills that are not found in Resume Skills.
5. Use only information available in the resume.
6. If information is missing, write: "Not available from resume".
7. Do not invent experience, education, companies, dates, roles or achievements.
8. Output professional analysis only.
9. Keep answers concise.
10. Match Score must remain exactly ${matchScore}%.

INPUT DATA:

Match Score: ${matchScore}%

Resume Skills:
${resumeSkills.join(", ") || "Not available from resume"}

Job Description Skills:
${jdSkills.join(", ") || "Not available from resume"}

Matched Skills:
${matchedSkills.join(", ") || "None"}

Missing Skills:
${missingSkills.join(", ") || "None"}

Resume Text:
${resumeText}

Job Description:
${jobDescription || "Not provided"}

OUTPUT FORMAT:

## Match Score
- ${matchScore}%

## Matched Skills
- List only skills actually present in Matched Skills.
- If none: Not available from resume

## Missing Skills
- List only skills actually present in Missing Skills.
- If none: Not available from resume

## Strengths
- Point based only on resume
- Point based only on resume

## Weaknesses
- Point based only on resume
- Point based only on resume

## Resume Improvements
- Actionable improvement
- Actionable improvement

## Recommended Jobs
- Recommend roles based only on actual resume skills and experience
- Do not invent qualifications

## ATS Score
- Give an ATS assessment based on resume quality.
- This is NOT the Match Score.

## Market Readiness
- Number from 0 to 100

## Hiring Probability
- Number from 0 to 100%

### Experience Evaluation
Return valid JSON:
{
  "yearsOfExperience": number,
  "roles": ["role1"],
  "careerProgression": "Entry-Level | Mid | Senior | Standard",
  "relevance": "Entry-Level | Mid-Level | Senior-Level",
  "assessment": "short reasoning based only on resume"
}

### Education Evaluation
Return valid JSON:
{
  "degrees": ["degree1"],
  "qualification": "Poor | Average | Good | Well-qualified | Excellent",
  "relevance": "Low | Medium | High | Excellent"
}

### Career Risk Analysis
Return valid JSON:
{
  "riskScore": number,
  "level": "LOW | MEDIUM | HIGH",
  "factors": ["real issue from resume"],
  "mitigation": ["actionable suggestion"]
}
`;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a strict ATS Resume Analyzer. Use only the supplied resume data. Never invent information. Never generate your own match score.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      model: MODEL,

      temperature: 0.2,

      max_tokens: 1800,
    });

    if (
      response &&
      response.choices &&
      response.choices.length > 0
    ) {
      return (
        response.choices[0].message?.content ||
        "No AI response generated."
      );
    }

    return "No AI response generated.";
  } catch (error) {
    console.error("Groq AI Error:", error);

    return "AI analysis failed.";
  }
}


/* =========================================================
   RESUME PROFILE EXTRACTION
   ---------------------------------------------------------
   Ye function resume ke andar se:
   - Professional Information
   - Skills
   - Education
   - Experience
   automatically extract karega.
========================================================= */

async function extractResumeProfile(resumeText) {
  try {
    if (!resumeText || !resumeText.trim()) {
      return {
        success: false,
        error: "Resume text is empty.",
        profile: {},
      };
    }

    const prompt = `
You are a professional resume parser.

Your job is to extract ONLY information that is explicitly present
in the resume text.

CRITICAL RULES:
1. NEVER invent information.
2. NEVER guess missing information.
3. If a field is not present, return an empty string.
4. If an array has no information, return [].
5. Preserve the actual information from the resume.
6. Extract ALL available skills.
7. Extract ALL education entries.
8. Extract ALL work experience entries.
9. Extract dates when available.
10. Extract responsibilities and achievements when available.
11. Do not summarize multiple education entries into one.
12. Do not summarize multiple jobs into one.
13. Do not add skills simply because a job title suggests them.
14. Return ONLY valid JSON.
15. No markdown.
16. No explanation outside JSON.

RESUME:

${resumeText}

RETURN EXACTLY THIS JSON STRUCTURE:

{
  "profile": {
    "headline": "",
    "location": "",
    "currentRole": "",
    "careerLevel": "",
    "yearsOfExperience": 0,
    "preferredRole": "",
    "preferredIndustry": "",

    "technicalSkills": [],
    "softSkills": [],
    "programmingLanguages": [],
    "tools": [],

    "education": [
      {
        "degree": "",
        "fieldOfStudy": "",
        "institution": "",
        "startYear": "",
        "graduationYear": "",
        "score": ""
      }
    ],

    "experience": [
      {
        "company": "",
        "jobTitle": "",
        "employmentType": "",
        "startDate": "",
        "endDate": "",
        "currentlyWorking": false,
        "responsibilities": "",
        "achievements": ""
      }
    ]
  }
}

SKILL RULES:

technicalSkills:
- Frameworks
- Libraries
- Databases
- APIs
- Cloud
- Architecture
- Development technologies

programmingLanguages:
- JavaScript
- Python
- Java
- C++
- C
- TypeScript
- PHP
- Go
- Rust
- etc.

tools:
- Git
- GitHub
- Docker
- Jenkins
- VS Code
- Jira
- AWS tools
- etc.

softSkills:
- Communication
- Leadership
- Teamwork
- Problem solving
- Time management
- etc.

IMPORTANT:
Only put a skill in an array if that skill is explicitly mentioned
in the resume.

EDUCATION:
Extract every education entry.

EXPERIENCE:
Extract every job/internship/freelance experience.

If the resume has no information for a particular field:
return empty string or [].

For yearsOfExperience:
- Use an explicitly stated total experience if available.
- Otherwise calculate only when the dates in the resume clearly support it.
- If it cannot be determined, use 0.

For careerLevel:
Use only:
"Fresher"
"Entry Level"
"Mid Level"
"Senior Level"
""

For employmentType:
Use only:
"Full-time"
"Part-time"
"Contract"
"Internship"
"Freelance"
""

Return JSON only.
`;

    const response =
      await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a strict resume extraction engine. Return valid JSON only. Never invent information.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        model: MODEL,

        temperature: 0,

        max_tokens: 3000,

        response_format: {
          type: "json_object",
        },
      });

    const content =
      response?.choices?.[0]?.message?.content || "{}";

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error(
        "Resume profile JSON parse error:",
        parseError
      );

      return {
        success: false,
        error: "Unable to parse resume profile.",
        profile: {},
      };
    }

    return {
      success: true,
      profile: normalizeResumeProfile(
        parsed.profile || {}
      ),
    };
  } catch (error) {
    console.error(
      "Resume Profile Extraction Error:",
      error
    );

    return {
      success: false,
      error:
        error.message ||
        "Unable to extract profile from resume.",
      profile: {},
    };
  }
}


/* =========================================================
   NORMALIZE EXTRACTED PROFILE
========================================================= */

function normalizeResumeProfile(profile = {}) {
  const safeArray = (value) =>
    Array.isArray(value) ? value : [];

  const normalizeSkill = (skill) => {
    if (typeof skill === "string") {
      return {
        name: skill.trim(),
        proficiency: "Intermediate",
      };
    }

    if (!skill || typeof skill !== "object") {
      return null;
    }

    if (!skill.name) {
      return null;
    }

    const allowedProficiency = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
    ];

    return {
      name: String(skill.name).trim(),

      proficiency:
        allowedProficiency.includes(
          skill.proficiency
        )
          ? skill.proficiency
          : "Intermediate",
    };
  };

  const cleanSkills = (skills) =>
    safeArray(skills)
      .map(normalizeSkill)
      .filter(Boolean)
      .filter(
        (skill, index, array) =>
          array.findIndex(
            (item) =>
              item.name.toLowerCase() ===
              skill.name.toLowerCase()
          ) === index
      );

  const cleanEducation = safeArray(
    profile.education
  )
    .map((item) => ({
      degree: item?.degree
        ? String(item.degree).trim()
        : "",

      fieldOfStudy: item?.fieldOfStudy
        ? String(item.fieldOfStudy).trim()
        : "",

      institution: item?.institution
        ? String(item.institution).trim()
        : "",

      startYear:
        item?.startYear !== undefined &&
        item?.startYear !== null &&
        item?.startYear !== ""
          ? Number(item.startYear)
          : "",

      graduationYear:
        item?.graduationYear !== undefined &&
        item?.graduationYear !== null &&
        item?.graduationYear !== ""
          ? Number(item.graduationYear)
          : "",

      score: item?.score
        ? String(item.score).trim()
        : "",
    }))
    .filter(
      (item) =>
        item.degree ||
        item.fieldOfStudy ||
        item.institution ||
        item.startYear ||
        item.graduationYear ||
        item.score
    );

  const cleanExperience = safeArray(
    profile.experience
  )
    .map((item) => ({
      company: item?.company
        ? String(item.company).trim()
        : "",

      jobTitle: item?.jobTitle
        ? String(item.jobTitle).trim()
        : "",

      employmentType:
        [
          "Full-time",
          "Part-time",
          "Contract",
          "Internship",
          "Freelance",
        ].includes(item?.employmentType)
          ? item.employmentType
          : "",

      startDate: item?.startDate || "",

      endDate: item?.endDate || "",

      currentlyWorking:
        Boolean(item?.currentlyWorking),

      responsibilities:
        item?.responsibilities
          ? String(
              item.responsibilities
            ).trim()
          : "",

      achievements:
        item?.achievements
          ? String(
              item.achievements
            ).trim()
          : "",
    }))
    .filter(
      (item) =>
        item.company ||
        item.jobTitle ||
        item.startDate ||
        item.endDate ||
        item.responsibilities ||
        item.achievements
    );

  let yearsOfExperience = Number(
    profile.yearsOfExperience
  );

  if (
    !Number.isFinite(yearsOfExperience) ||
    yearsOfExperience < 0
  ) {
    yearsOfExperience = 0;
  }

  if (yearsOfExperience > 80) {
    yearsOfExperience = 80;
  }

  const careerLevels = [
    "Fresher",
    "Entry Level",
    "Mid Level",
    "Senior Level",
  ];

  const careerLevel =
    careerLevels.includes(
      profile.careerLevel
    )
      ? profile.careerLevel
      : "";

  return {
    headline: profile.headline
      ? String(profile.headline).trim()
      : "",

    location: profile.location
      ? String(profile.location).trim()
      : "",

    currentRole: profile.currentRole
      ? String(profile.currentRole).trim()
      : "",

    careerLevel,

    yearsOfExperience,

    preferredRole: profile.preferredRole
      ? String(profile.preferredRole).trim()
      : "",

    preferredIndustry:
      profile.preferredIndustry
        ? String(
            profile.preferredIndustry
          ).trim()
        : "",

    technicalSkills: cleanSkills(
      profile.technicalSkills
    ),

    softSkills: cleanSkills(
      profile.softSkills
    ),

    programmingLanguages: cleanSkills(
      profile.programmingLanguages
    ),

    tools: cleanSkills(
      profile.tools
    ),

    education: cleanEducation,

    experience: cleanExperience,
  };
}


/* =========================================================
   INTERVIEW JSON REQUEST
========================================================= */

async function requestInterviewJSON(prompt) {
  const response =
    await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You evaluate interview answers using only observable answer content and communication signals. Never infer personality, emotion, mental state, or sensitive traits. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      model: MODEL,

      temperature: 0.2,

      max_tokens: 800,

      response_format: {
        type: "json_object",
      },
    });

  const content =
    response?.choices?.[0]?.message?.content ||
    "{}";

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(
      "Interview JSON parse error:",
      error
    );

    return {};
  }
}


/* =========================================================
   INTERVIEW ANSWER ANALYSIS
========================================================= */

async function analyzeInterviewAnswer({
  question,
  answer,
  answerDuration,
  wordCount,
}) {
  return requestInterviewJSON(`
Evaluate this interview answer.

Return an object with evaluation containing integer
scores from 0 to 100 for:

- answerScore
- relevanceScore
- clarityScore
- completenessScore
- communicationScore
- confidenceScore

Also return:
- strengths
- improvements

Confidence must mean observable delivery signals only,
not a psychological judgment.

Technical correctness may be included only when applicable.
Do not invent facts.

Question:
${question}

Answer:
${answer}

Duration seconds:
${answerDuration}

Word count:
${wordCount}
`);
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = analyzeWithAI;

module.exports.analyzeInterviewAnswer =
  analyzeInterviewAnswer;

module.exports.extractResumeProfile =
  extractResumeProfile;
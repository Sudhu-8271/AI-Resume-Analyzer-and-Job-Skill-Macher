/**
 * RESUME-AWARE RAG CONTEXT BUILDER
 * Builds semantic context from resume data for AI responses
 * Priority-based context layering for consistent answers
 */

class ResumeContextBuilder {
  /**
   * Build comprehensive context for AI responses
   * Priority 1: User Resume Data
   * Priority 2: Job Description
   * Priority 3: Career Knowledge Base
   * Priority 4: Market Trends
   */
  static buildContext(resumeData, jobDescription = "", marketData = {}) {
    return {
      resumeContext: this.extractResumeContext(resumeData),
      jobContext: this.extractJobContext(jobDescription),
      marketContext: marketData,
      sessionMemory: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract structured resume context
   */
  static extractResumeContext(resumeData) {
    const {
      resumeText = "",
      resumeSkills = [],
      missingSkills = [],
      matchedSkills = [],
      matchScore = 0,
    } = resumeData;

    return {
      text: resumeText,
      skills: {
        all: resumeSkills || [],
        matched: matchedSkills || [],
        missing: missingSkills || [],
      },
      experience: this.extractExperience(resumeText),
      education: this.extractEducation(resumeText),
      projects: this.extractProjects(resumeText),
      certifications: this.extractCertifications(resumeText),
      strengths: this.identifyStrengths(resumeData),
      weaknesses: this.identifyWeaknesses(resumeData),
      gaps: this.identifyGaps(resumeData),
      matchScore: matchScore,
    };
  }

  /**
   * Extract job description context
   */
  static extractJobContext(jobDescription) {
    if (!jobDescription || jobDescription.trim().length === 0) {
      return {
        text: "",
        skills: [],
        requirements: [],
        responsibilities: [],
        seniority: "Not specified",
        industry: "Not specified",
      };
    }

    return {
      text: jobDescription,
      skills: this.extractSkillsFromText(jobDescription),
      requirements: this.extractRequirements(jobDescription),
      responsibilities: this.extractResponsibilities(jobDescription),
      seniority: this.identifySeniority(jobDescription),
      industry: this.identifyIndustry(jobDescription),
    };
  }

  /**
   * Extract experience from resume text
   */
  static extractExperience(resumeText) {
    const lowerText = resumeText.toLowerCase();

    // Try to find experience sections
    const experienceSection =
      resumeText.match(/experience[\s\n]+([\s\S]*?)(?=education|skills|$)/i)?.[1] ||
      "";

    // Extract job titles
    const jobTitles = [
      "software engineer",
      "developer",
      "manager",
      "analyst",
      "designer",
      "architect",
      "lead",
      "director",
      "coordinator",
      "specialist",
      "consultant",
    ];

    const foundRoles = jobTitles.filter((title) =>
      lowerText.includes(title)
    );

    // Extract years of experience
    const yearsMatch = resumeText.match(/(\d+)\s*\+?\s*years/gi);
    const yearsOfExperience = yearsMatch
      ? Math.max(...yearsMatch.map((m) => parseInt(m)))
      : 0;

    return {
      roles: foundRoles,
      years: yearsOfExperience,
      text: experienceSection,
    };
  }

  /**
   * Extract education from resume text
   */
  static extractEducation(resumeText) {
    const degrees = [
      { name: "Bachelor", pattern: /bachelor|b\.?s\.?|b\.?a\.?/i },
      { name: "Master", pattern: /master|m\.?s\.?|m\.?a\.?/i },
      { name: "PhD", pattern: /phd|ph\.?d\.?/i },
      { name: "Diploma", pattern: /diploma/i },
      { name: "Certification", pattern: /certification|certified/i },
    ];

    const foundDegrees = degrees.filter((degree) =>
      degree.pattern.test(resumeText)
    );

    // Extract universities
    const universities = resumeText.match(
      /(?:university|institute|college|school)\s+(?:of\s+)?([^,\n]+)/gi
    ) || [];

    return {
      degrees: foundDegrees.map((d) => d.name),
      universities: universities.map((u) => u.trim()),
    };
  }

  /**
   * Extract projects from resume text
   */
  static extractProjects(resumeText) {
    const projectSection =
      resumeText.match(
        /projects?[\s\n]+([\s\S]*?)(?=skills|experience|education|$)/i
      )?.[1] || "";

    // Split by common separators
    const projects = projectSection
      .split(/[-•\n]\s*/)
      .filter((p) => p.trim().length > 10)
      .slice(0, 5);

    return projects;
  }

  /**
   * Extract certifications from resume text
   */
  static extractCertifications(resumeText) {
    const certPatterns = [
      /aws certified/gi,
      /gcp certified/gi,
      /azure certified/gi,
      /certified kubernetes/gi,
      /scrum master/gi,
      /project management professional/gi,
      /comptia/gi,
      /cisco/gi,
      /oracle certified/gi,
    ];

    return certPatterns.flatMap(
      (pattern) => resumeText.match(pattern) || []
    );
  }

  /**
   * Extract skills from text
   */
  static extractSkillsFromText(text) {
    const skillKeywords = [
      "javascript",
      "python",
      "java",
      "c++",
      "react",
      "angular",
      "vue",
      "node",
      "express",
      "django",
      "sql",
      "mongodb",
      "postgresql",
      "aws",
      "docker",
      "kubernetes",
      "git",
      "rest",
      "graphql",
      "machine learning",
      "data science",
      "ai",
      "agile",
      "scrum",
      "communication",
      "leadership",
      "problem solving",
    ];

    return skillKeywords.filter((skill) =>
      text.toLowerCase().includes(skill)
    );
  }

  /**
   * Extract requirements from job description
   */
  static extractRequirements(jobDescription) {
    const requirementSection =
      jobDescription.match(
        /requirements?[\s\n]+([\s\S]*?)(?=responsibilities|about|$)/i
      )?.[1] || jobDescription;

    const requirements = requirementSection
      .split(/[-•\n]/)
      .filter((r) => r.trim().length > 5)
      .slice(0, 10);

    return requirements.map((r) => r.trim());
  }

  /**
   * Extract responsibilities from job description
   */
  static extractResponsibilities(jobDescription) {
    const respSection =
      jobDescription.match(
        /responsibilities?[\s\n]+([\s\S]*?)(?=requirements|about|$)/i
      )?.[1] || "";

    const responsibilities = respSection
      .split(/[-•\n]/)
      .filter((r) => r.trim().length > 5)
      .slice(0, 8);

    return responsibilities.map((r) => r.trim());
  }

  /**
   * Identify seniority level from job description
   */
  static identifySeniority(jobDescription) {
    const lower = jobDescription.toLowerCase();

    if (/senior|lead|principal|staff/i.test(lower)) return "Senior";
    if (/mid-level|intermediate/i.test(lower)) return "Mid-Level";
    if (/junior|entry|graduate/i.test(lower)) return "Junior";
    return "Not Specified";
  }

  /**
   * Identify industry from job description
   */
  static identifyIndustry(jobDescription) {
    const industries = {
      "Technology/IT": /software|developer|tech|it|coding|programming/i,
      Finance: /finance|banking|investment|trading|accounting/i,
      Healthcare: /healthcare|medical|hospital|clinical/i,
      Marketing: /marketing|advertising|brand|campaign/i,
      Operations: /operations|supply chain|logistics/i,
      Consulting: /consultant|consulting|advisory/i,
    };

    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(jobDescription)) {
        return industry;
      }
    }

    return "Other";
  }

  /**
   * Identify strengths from resume data
   */
  static identifyStrengths(resumeData) {
    const strengths = [];
    const { matchedSkills = [], matchScore = 0 } = resumeData;

    if (matchedSkills.length >= 5) {
      strengths.push(
        "Strong foundation in multiple required technologies"
      );
    }

    if (matchScore >= 70) {
      strengths.push("Excellent alignment with job requirements");
    }

    strengths.push("Demonstrated experience in relevant field");

    return strengths;
  }

  /**
   * Identify weaknesses from resume data
   */
  static identifyWeaknesses(resumeData) {
    const weaknesses = [];
    const { missingSkills = [], matchScore = 0 } = resumeData;

    if (missingSkills.length >= 3) {
      weaknesses.push(
        `Missing key skills: ${missingSkills.slice(0, 3).join(", ")}`
      );
    }

    if (matchScore < 50) {
      weaknesses.push("Significant skill gaps compared to requirements");
    }

    return weaknesses;
  }

  /**
   * Identify skill gaps
   */
  static identifyGaps(resumeData) {
    const { missingSkills = [] } = resumeData;

    return {
      critical: missingSkills.slice(0, 3),
      secondary: missingSkills.slice(3, 6),
      totalGaps: missingSkills.length,
    };
  }

  /**
   * Add message to session memory
   */
  static addToMemory(context, role, message) {
    if (!context.sessionMemory) {
      context.sessionMemory = [];
    }

    context.sessionMemory.push({
      role,
      message,
      timestamp: new Date().toISOString(),
    });

    // Keep last 10 messages
    if (context.sessionMemory.length > 10) {
      context.sessionMemory = context.sessionMemory.slice(-10);
    }

    return context;
  }

  /**
   * Generate contextual prompt for AI
   */
  static generateSystemPrompt(context) {
    const {
      resumeContext = {},
      jobContext = {},
      marketContext = {},
    } = context;

    return `
You are an expert AI Career Assistant and Resume Mentor.

CRITICAL RULES:
1. ALWAYS prioritize user's resume data - NEVER invent information
2. Reference ACTUAL skills and experience from the resume
3. Use EXACT terminology from job description when provided
4. If information is not in the data, clearly state: "This is not mentioned in your resume"
5. Provide SPECIFIC advice based on the user's actual background
6. Respond in concise bullet points only. Do NOT use paragraphs.
7. Never generate generic responses or motivational speech
8. Always maintain context from conversation history

USER RESUME SUMMARY:
${this.formatResumeSummary(resumeContext)}

JOB REQUIREMENTS (if provided):
${this.formatJobSummary(jobContext)}

MARKET CONTEXT:
${this.formatMarketContext(marketContext)}

CONVERSATION GUIDELINES:
- Ask follow-up questions to understand context better
- Provide confidence levels for recommendations
- Suggest concrete action items based on actual resume data
- Acknowledge strengths before suggesting improvements
- Be honest about skill gaps
- Provide learning paths for missing skills
`;
  }

  static formatResumeSummary(resumeContext) {
    if (!resumeContext || Object.keys(resumeContext).length === 0) {
      return "No resume data provided yet.";
    }

    return `
Skills: ${(resumeContext.skills?.all || []).join(", ") || "Not specified"}
Years of Experience: ${resumeContext.experience?.years || 0}
Education: ${resumeContext.education?.degrees?.join(", ") || "Not specified"}
Match Score: ${resumeContext.matchScore}%
Matched Skills: ${(resumeContext.skills?.matched || []).join(", ") || "None"}
Missing Skills: ${(resumeContext.skills?.missing || []).join(", ") || "None"}
    `;
  }

  static formatJobSummary(jobContext) {
    if (!jobContext || Object.keys(jobContext).length === 0) {
      return "No job description provided.";
    }

    return `
Industry: ${jobContext.industry || "Not specified"}
Seniority Level: ${jobContext.seniority || "Not specified"}
Required Skills: ${(jobContext.skills || []).join(", ") || "Not specified"}
Key Requirements: ${(jobContext.requirements || []).slice(0, 3).join("; ") || "Not specified"}
    `;
  }

  static formatMarketContext(marketContext) {
    if (!marketContext || Object.keys(marketContext).length === 0) {
      return "Market data not available.";
    }

    return `
Trending Skills: ${(marketContext.trendingSkills || []).join(", ") || "Not specified"}
Market Demand: ${marketContext.demandLevel || "Not specified"}
Average Salary: ${marketContext.averageSalary || "Not specified"}
    `;
  }
}

module.exports = ResumeContextBuilder;

/**
 * ENHANCED ANALYSIS REPORT GENERATOR
 * Generates comprehensive resume analysis reports with all required sections
 */

const ScoringEngine = require("./scoringEngine");

class AnalysisReportGenerator {
  /**
   * Generate comprehensive analysis report
   */
  static generateReport(resumeData, jobDescription = "") {
    const {
      resumeText = "",
      resumeSkills = [],
      jdSkills = [],
      matchedSkills = [],
      missingSkills = [],
    } = resumeData;

    // Use centralized scoring engine
    const scoring = ScoringEngine.calculateMatchScore({
      matchedSkills,
      missingSkills,
      resumeSkills,
      jdSkills,
      resumeText,
      jobDescription,
      experienceYears: this.extractExperienceYears(resumeText),
      educationMatch: this.checkEducationMatch(resumeText),
    });

    return {
      matchScore: scoring.matchScore,
      atsScore: this.calculateATSScore(resumeText, jdSkills),
      scoreBreakdown: scoring.breakdown,
      confidence: scoring.confidence,
      justification: ScoringEngine.generateJustification(
        scoring.matchScore,
        scoring.breakdown
      ),

      // Core metrics
      strengths: this.identifyStrengths(resumeData, jobDescription),
      weaknesses: this.identifyWeaknesses(resumeData, jobDescription),
      matchedSkills: matchedSkills.slice(0, 10),
      missingSkills: missingSkills.slice(0, 10),
      keywordGaps: this.findKeywordGaps(resumeText, jobDescription),

      // Improvements & recommendations
      resumeImprovements: this.generateImprovements(resumeData, jobDescription),
      recommendedJobs: this.generateRecommendedJobs(resumeData, jobDescription),
      nextSteps: this.generateNextSteps(resumeData, jobDescription),

      // Detailed evaluations
      experienceEvaluation: this.evaluateExperience(resumeText, jobDescription),
      educationEvaluation: this.evaluateEducation(resumeText),
      skillsAnalysis: this.analyzeSkills(
        resumeSkills,
        jdSkills,
        matchedSkills,
        missingSkills
      ),

      // Career metrics
      marketReadinessScore: this.calculateMarketReadiness(
        resumeData,
        jobDescription
      ),
      careerRiskAnalysis: this.analyzeCareerRisk(resumeData),
      hiringProbability: this.calculateHiringProbability(
        scoring.matchScore,
        resumeData
      ),

      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate ATS Score (0-100)
   */
  static calculateATSScore(resumeText, jdSkills) {
    let score = 50;

    // Check for proper formatting (20 points)
    const hasProperSections = this.hasProperSections(resumeText);
    score += hasProperSections ? 10 : 0;

    const hasContactInfo = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(
      resumeText
    );
    score += hasContactInfo ? 5 : 0;

    // Check for keywords (30 points)
    const keywordMatches = jdSkills.filter((skill) =>
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );
    const keywordScore = (keywordMatches.length / jdSkills.length) * 30;
    score += Math.min(keywordScore, 30);

    // Check for quantifiable results (15 points)
    const hasMetrics = /(\d+%|\$\d+|increased|improved|reduced)/i.test(
      resumeText
    );
    score += hasMetrics ? 15 : 0;

    // Check for action verbs (10 points)
    const actionVerbs =
      /^(led|managed|developed|implemented|designed|created|built|improved|optimized|achieved)/im;
    score += actionVerbs.test(resumeText) ? 10 : 0;

    // Check for clear structure (5 points)
    const hasYears = /\d+\s*(?:years?|yr)/i.test(resumeText);
    score += hasYears ? 5 : 0;

    return Math.min(100, Math.round(score));
  }

  /**
   * Identify strengths from resume
   */
  static identifyStrengths(resumeData, jobDescription) {
    const {
      resumeSkills = [],
      matchedSkills = [],
      resumeText = "",
    } = resumeData;
    const strengths = [];

    // Strong skill match
    if (matchedSkills.length >= 5) {
      strengths.push(
        `Excellent skill alignment: ${matchedSkills.slice(0, 3).join(", ")} and more`
      );
    }

    // Experience indicators
    if (/senior|lead|principal|architect/i.test(resumeText)) {
      strengths.push("Strong seniority and leadership experience");
    }

    // Project complexity
    if (
      /scalable|high-traffic|enterprise|distributed|architecture/i.test(
        resumeText
      )
    ) {
      strengths.push("Experience with complex, scalable systems");
    }

    // Communication & collaboration
    if (/team|collaborate|mentor|communicate|agile/i.test(resumeText)) {
      strengths.push("Strong collaboration and communication skills");
    }

    // Certifications
    if (/certified|certification|aws|azure|gcp|kubernetes/i.test(resumeText)) {
      strengths.push("Relevant professional certifications");
    }

    // Demonstrated impact
    if (/improved|increased|reduced|optimized|performance/i.test(resumeText)) {
      strengths.push("Track record of delivering measurable impact");
    }

    return strengths.slice(0, 6);
  }

  /**
   * Identify weaknesses
   */
  static identifyWeaknesses(resumeData, jobDescription) {
    const { missingSkills = [], resumeText = "", matchScore = 0 } = resumeData;
    const weaknesses = [];

    // Critical skill gaps
    if (missingSkills.length >= 3) {
      weaknesses.push(
        `Missing critical skills: ${missingSkills.slice(0, 2).join(", ")}`
      );
    }

    // Experience gaps
    if (/recent graduate|entry-level|internship/i.test(resumeText)) {
      weaknesses.push("Limited professional experience");
    }

    // Low match score
    if (matchScore < 50) {
      weaknesses.push(
        "Significant alignment gap with job requirements"
      );
    }

    // No quantifiable metrics
    if (!/\d+%|\$\d+|increased|improved/i.test(resumeText)) {
      weaknesses.push(
        "Limited use of quantifiable results and impact metrics"
      );
    }

    // No visible learning
    if (!/certification|course|training|conference|skill development/i.test(
      resumeText
    )) {
      weaknesses.push(
        "Limited evidence of continuous learning and skill development"
      );
    }

    return weaknesses.slice(0, 5);
  }

  /**
   * Find keyword gaps
   */
  static findKeywordGaps(resumeText, jobDescription) {
    const resumeKeywords = this.extractKeywords(resumeText);
    const jdKeywords = this.extractKeywords(jobDescription);

    const gaps = jdKeywords.filter(
      (kw) => !resumeKeywords.some((rk) => this.keywordsSimilar(rk, kw))
    );

    return gaps.slice(0, 10);
  }

  /**
   * Evaluate experience
   */
  static evaluateExperience(resumeText, jobDescription) {
    const yearsMatch = resumeText.match(/(\d+)\s*(?:years?|yr)/i);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;

    const roles = (resumeText.match(/(?:as|worked as|role:)\s*([^,\n]+)/gi) || [])
      .slice(0, 5);

    const progressionIndicators = (
      resumeText.match(/(?:promoted|advanced|progressed|transitioned)/gi) || []
    ).length;

    return {
      yearsOfExperience: years,
      roles: roles.map((r) => r.replace(/^as|worked as|role:\s*/i, "")),
      careerProgression: progressionIndicators > 0 ? "Strong" : "Standard",
      relevance:
        years >= 3
          ? "Highly Relevant"
          : years >= 1
          ? "Relevant"
          : "Entry-Level",
      assessment: `${years} years of experience with relevant background`,
    };
  }

  /**
   * Evaluate education
   */
  static evaluateEducation(resumeText) {
    const degrees = [];

    const degreePatterns = {
      bachelor: /bachelor|b\.?s\.?|b\.?a\.?/i,
      master: /master|m\.?s\.?|m\.?a\.?/i,
      phd: /phd|ph\.?d\.?/i,
      diploma: /diploma|associate/i,
      certification: /certification|certified|course/i,
    };

    for (const [degree, pattern] of Object.entries(degreePatterns)) {
      if (pattern.test(resumeText)) {
        degrees.push(degree);
      }
    }

    return {
      degrees: degrees,
      qualification:
        degrees.length > 0
          ? "Well-qualified"
          : "Self-taught/Bootcamp",
      relevance:
        degrees.includes("master") || degrees.includes("phd")
          ? "Excellent"
          : degrees.includes("bachelor")
          ? "Good"
          : "Developing",
    };
  }

  /**
   * Analyze skills
   */
  static analyzeSkills(resumeSkills, jdSkills, matchedSkills, missingSkills) {
    return {
      total: resumeSkills.length,
      matched: matchedSkills.length,
      missing: missingSkills.length,
      matchPercentage:
        jdSkills.length > 0
          ? Math.round((matchedSkills.length / jdSkills.length) * 100)
          : 0,
      matchedSkills: matchedSkills.slice(0, 10),
      missingSkills: missingSkills.slice(0, 10),
      recommendation:
        matchedSkills.length >= jdSkills.length * 0.75
          ? "Strong skills match"
          : matchedSkills.length >= jdSkills.length * 0.5
          ? "Moderate match, focus on missing skills"
          : "Significant skill gaps need addressing",
    };
  }

  /**
   * Calculate market readiness score
   */
  static calculateMarketReadiness(resumeData, jobDescription) {
    const { matchedSkills = [], missingSkills = [], matchScore = 0 } = resumeData;

    let readinessScore = matchScore * 0.6; // 60% weight to match score

    // Additional factors
    if (matchedSkills.length >= 5) readinessScore += 10;
    if (missingSkills.length <= 2) readinessScore += 10;
    if (/senior|lead/i.test(resumeData.resumeText)) readinessScore += 10;

    const readinessLevel =
      readinessScore >= 80
        ? "Ready to Apply"
        : readinessScore >= 60
        ? "Good Fit"
        : readinessScore >= 40
        ? "Developing"
        : "Needs Preparation";

    return {
      score: Math.round(readinessScore),
      level: readinessLevel,
      recommendation:
        readinessScore >= 70
          ? "Ready to apply immediately"
          : "Address skill gaps before applying",
    };
  }

  /**
   * Analyze career risk
   */
  static analyzeCareerRisk(resumeData) {
    const { missingSkills = [], matchScore = 0 } = resumeData;

    const riskFactors = [];
    let riskScore = 0;

    if (matchScore < 40) {
      riskFactors.push(
        "Low match score indicates potential role mismatch"
      );
      riskScore += 30;
    }

    if (missingSkills.length > 5) {
      riskFactors.push("Multiple critical skill gaps");
      riskScore += 25;
    }

    if (!/leadership|management|mentoring/i.test(resumeData.resumeText)) {
      riskFactors.push("Limited leadership experience");
      riskScore += 15;
    }

    const riskLevel =
      riskScore >= 50 ? "HIGH" : riskScore >= 25 ? "MEDIUM" : "LOW";

    return {
      riskScore: Math.min(100, riskScore),
      level: riskLevel,
      factors: riskFactors,
      mitigation: this.generateRiskMitigation(riskFactors),
    };
  }

  /**
   * Calculate hiring probability
   */
  static calculateHiringProbability(matchScore, resumeData) {
    let probability = matchScore * 0.8;

    // Boost if strong experience
    if (/senior|lead|architect/i.test(resumeData.resumeText)) {
      probability += 5;
    }

    // Boost for relevant certifications
    if (/certified|certification/i.test(resumeData.resumeText)) {
      probability += 5;
    }

    probability = Math.min(100, probability);

    return {
      probability: Math.round(probability),
      category:
        probability >= 75
          ? "EXCELLENT"
          : probability >= 50
          ? "GOOD"
          : probability >= 25
          ? "FAIR"
          : "LOW",
      insight:
        probability >= 75
          ? "Strong candidate for this role"
          : probability >= 50
          ? "Competitive candidate with some preparation"
          : "Consider additional skill development",
    };
  }

  /**
   * Generate improvements
   */
  static generateImprovements(resumeData, jobDescription) {
    const { missingSkills = [], resumeText = "", matchedSkills = [] } =
      resumeData;

    const improvements = [];

    // Skill improvements
    if (missingSkills.length > 0) {
      improvements.push({
        category: "Skills",
        action: `Learn: ${missingSkills.slice(0, 3).join(", ")}`,
        impact: "HIGH",
        timeline: "1-3 months",
      });
    }

    // Experience improvements
    if (!/measurable|quantified|impact/i.test(resumeText)) {
      improvements.push({
        category: "Experience Description",
        action:
          "Add quantifiable metrics and business impact to each role",
        impact: "HIGH",
        timeline: "1 week",
      });
    }

    // Certification improvements
    if (!/certified|certification/i.test(resumeText)) {
      improvements.push({
        category: "Credentials",
        action: "Pursue relevant industry certifications",
        impact: "MEDIUM",
        timeline: "2-3 months",
      });
    }

    // Project showcase
    if (!/portfolio|github|project/i.test(resumeText)) {
      improvements.push({
        category: "Portfolio",
        action: "Build and showcase 2-3 relevant projects",
        impact: "HIGH",
        timeline: "1-2 months",
      });
    }

    return improvements.slice(0, 5);
  }

  static generateRecommendedJobs(resumeData, jobDescription) {
    const { matchedSkills = [], resumeSkills = [] } = resumeData;
    const allSkills = [
      ...new Set([
        ...matchedSkills.map((s) => s.toLowerCase()),
        ...resumeSkills.map((s) => s.toLowerCase()),
      ]),
    ];
    const recommendations = new Set();

    const skillText = allSkills.join(" ");

    if (/react|angular|vue|frontend|typescript|javascript/.test(skillText)) {
      if (/node|express|backend|api|mongodb|sql|postgresql/.test(skillText)) {
        recommendations.add("Full Stack Developer");
      } else {
        recommendations.add("Frontend Developer");
      }
    }

    if (/node|express|backend|api|mongodb|sql|postgresql|java|python|django|flask/.test(skillText)) {
      recommendations.add("Backend Developer");
    }

    if (/aws|azure|gcp|docker|kubernetes|devops|terraform/.test(skillText)) {
      recommendations.add("Cloud/DevOps Engineer");
    }

    if (/python|machine learning|ml|data science|pytorch|tensorflow|ai/.test(skillText)) {
      recommendations.add("Machine Learning Engineer");
    }

    if (/data science|analytics|spark|sql/.test(skillText)) {
      recommendations.add("Data Engineer");
    }

    if (recommendations.size === 0 && allSkills.length > 0) {
      recommendations.add("Technical Specialist");
    }

    return Array.from(recommendations).slice(0, 5);
  }

  /**
   * Generate next steps
   */
  static generateNextSteps(resumeData, jobDescription) {
    const { matchScore = 0 } = resumeData;

    if (matchScore >= 75) {
      return [
        "Resume is well-aligned. Review company details and prepare for interview.",
        "Practice common interview questions related to your experience.",
        "Prepare specific examples using STAR method.",
        "Research the company culture and values.",
      ];
    } else if (matchScore >= 50) {
      return [
        "Focus on learning missing skills.",
        "Update resume to emphasize transferable skills.",
        "Build a portfolio project showcasing relevant skills.",
        "Network with professionals in the target role.",
      ];
    } else {
      return [
        "Significant skill gap detected. Prioritize learning critical skills.",
        "Consider related roles that better match current skill set.",
        "Create a 3-6 month learning roadmap.",
        "Take online courses or bootcamps to accelerate learning.",
      ];
    }
  }

  // ====== HELPER METHODS ======

  static hasProperSections(text) {
    const sections = [
      "experience",
      "education",
      "skills",
      "contact",
      "summary",
    ];
    return sections.filter((section) =>
      text.toLowerCase().includes(section)
    ).length >= 3;
  }

  static extractExperienceYears(resumeText) {
    const match = resumeText.match(/(\d+)\s*(?:years?|yr)/i);
    return match ? parseInt(match[1]) : 0;
  }

  static checkEducationMatch(resumeText) {
    return /bachelor|master|phd|diploma|degree/i.test(resumeText);
  }

  static extractKeywords(text) {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const stopWords = new Set([
      "the",
      "a",
      "and",
      "or",
      "is",
      "was",
      "be",
      "in",
      "on",
      "at",
      "to",
      "for",
    ]);
    return words.filter((word) => word.length > 3 && !stopWords.has(word));
  }

  static keywordsSimilar(kw1, kw2) {
    return (
      kw1.toLowerCase() === kw2.toLowerCase() ||
      kw1.toLowerCase().includes(kw2.toLowerCase())
    );
  }

  static generateRiskMitigation(riskFactors) {
    return riskFactors.map(
      (factor) =>
        `Mitigate: ${factor} - Focus on targeted skill development and relevant projects`
    );
  }
}

module.exports = AnalysisReportGenerator;

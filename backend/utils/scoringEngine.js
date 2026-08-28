/**
 * CENTRALIZED SCORING ENGINE
 * Single source of truth for all match calculations
 * Ensures consistency across all modules
 */

class ScoringEngine {
  /**
   * Calculate comprehensive match score using weighted formula
   * Formula: Skills(40%) + Experience(25%) + Education(10%) + Keywords(15%) + Industry(10%)
   */
  static calculateMatchScore(data) {
    const {
      matchedSkills = [],
      missingSkills = [],
      resumeSkills = [],
      jdSkills = [],
      resumeText = "",
      jobDescription = "",
      experienceYears = 0,
      educationMatch = false,
    } = data;

    // 1. SKILLS MATCH (40%)
    const skillsScore = this.calculateSkillsMatch(
      matchedSkills,
      missingSkills,
      jdSkills
    );

    // 2. EXPERIENCE MATCH (25%)
    const experienceScore = this.calculateExperienceMatch(
      experienceYears,
      resumeText
    );

    // 3. EDUCATION MATCH (10%)
    const educationScore = educationMatch ? 100 : 0;

    // 4. KEYWORDS MATCH (15%)
    const keywordsScore = this.calculateKeywordMatch(
      resumeText,
      jobDescription
    );

    // 5. INDUSTRY RELEVANCE (10%)
    const industryScore = this.calculateIndustryRelevance(
      resumeText,
      jobDescription
    );

    // Calculate weighted score
    const totalScore =
      skillsScore * 0.4 +
      experienceScore * 0.25 +
      educationScore * 0.1 +
      keywordsScore * 0.15 +
      industryScore * 0.1;

    return {
      matchScore: Math.round(totalScore),
      breakdown: {
        skillsMatch: Math.round(skillsScore),
        experienceMatch: Math.round(experienceScore),
        educationMatch: Math.round(educationScore),
        keywordsMatch: Math.round(keywordsScore),
        industryRelevance: Math.round(industryScore),
      },
      confidence: this.calculateConfidence(totalScore),
    };
  }

  /**
   * Skills Match Calculation (40%)
   */
  static calculateSkillsMatch(matchedSkills, missingSkills, jdSkills) {
    if (jdSkills.length === 0) return 0;

    const matchPercentage = (matchedSkills.length / jdSkills.length) * 100;

    // Bonus for exceeding requirements
    const bonus = Math.max(0, matchPercentage - 100) * 0.5;

    return Math.min(100, matchPercentage + bonus);
  }

  /**
   * Experience Match Calculation (25%)
   */
  static calculateExperienceMatch(experienceYears, resumeText) {
    const lowerText = resumeText.toLowerCase();

    // Detect experience indicators
    let detectedYears = 0;

    // Pattern: "X years"
    const yearsMatch = resumeText.match(/(\d+)\s*\+?\s*years/gi);
    if (yearsMatch) {
      detectedYears = Math.max(
        ...yearsMatch.map((m) => parseInt(m))
      );
    }

    // Detect seniority levels
    const seniorityIndicators = [
      { pattern: /senior|lead|principal/i, weight: 3 },
      { pattern: /mid-level|intermediate/i, weight: 2 },
      { pattern: /junior|entry/i, weight: 1 },
    ];

    let seniorityScore = 0;
    seniorityIndicators.forEach((indicator) => {
      if (indicator.pattern.test(lowerText)) {
        seniorityScore = indicator.weight;
      }
    });

    // Detect role transitions (career progression)
    const roleTransitions = (lowerText.match(/(\w+)\s*→|to\s*(\w+)/gi) || [])
      .length;

    const experienceScore =
      Math.min(detectedYears * 20, 80) + // Base score from years
      seniorityScore * 10 + // Seniority bonus
      roleTransitions * 5; // Progression bonus

    return Math.min(100, experienceScore);
  }

  /**
   * Education Match Calculation (10%)
   */
  static calculateEducationMatch(resumeText) {
    const lowerText = resumeText.toLowerCase();

    const degrees = [
      { pattern: /bachelor|b\.?s\.?|b\.?a\.?/i, score: 60 },
      { pattern: /master|m\.?s\.?|m\.?a\.?/i, score: 80 },
      { pattern: /phd|ph\.?d\.?/i, score: 100 },
      { pattern: /diploma|certification|certified/i, score: 40 },
    ];

    let maxScore = 0;
    degrees.forEach((degree) => {
      if (degree.pattern.test(lowerText)) {
        maxScore = Math.max(maxScore, degree.score);
      }
    });

    return maxScore;
  }

  /**
   * Keywords Match Calculation (15%)
   */
  static calculateKeywordMatch(resumeText, jobDescription) {
    const resumeKeywords = this.extractKeywords(resumeText);
    const jdKeywords = this.extractKeywords(jobDescription);

    if (jdKeywords.length === 0) return 0;

    const matchedKeywords = resumeKeywords.filter((kw) =>
      jdKeywords.some(
        (jdKw) =>
          jdKw.toLowerCase() === kw.toLowerCase() ||
          this.isSimilar(kw, jdKw)
      )
    );

    return (matchedKeywords.length / jdKeywords.length) * 100;
  }

  /**
   * Industry Relevance (10%)
   */
  static calculateIndustryRelevance(resumeText, jobDescription) {
    const industryTerms = {
      tech: [
        "software",
        "developer",
        "engineer",
        "tech",
        "it",
        "coding",
        "programming",
      ],
      finance: [
        "finance",
        "banking",
        "investment",
        "accounting",
        "trading",
        "analyst",
      ],
      healthcare: ["healthcare", "medical", "hospital", "clinical", "patient"],
      marketing: ["marketing", "brand", "campaign", "advertising", "social"],
      operations: [
        "operations",
        "supply chain",
        "logistics",
        "process",
        "management",
      ],
    };

    const lowerResume = resumeText.toLowerCase();
    const lowerJd = jobDescription.toLowerCase();

    let relevanceScore = 0;

    for (const [industry, terms] of Object.entries(industryTerms)) {
      const jdMatches = terms.filter((term) =>
        lowerJd.includes(term)
      ).length;
      const resumeMatches = terms.filter((term) =>
        lowerResume.includes(term)
      ).length;

      if (jdMatches > 0 && resumeMatches > 0) {
        relevanceScore = Math.min(100, 50 + resumeMatches * 10);
      }
    }

    return relevanceScore;
  }

  /**
   * Extract main keywords from text
   */
  static extractKeywords(text) {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "is",
      "was",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "what",
      "which",
      "who",
      "when",
      "where",
      "why",
      "how",
    ]);

    return words.filter((word) => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Check similarity between keywords
   */
  static isSimilar(word1, word2) {
    const w1 = word1.toLowerCase();
    const w2 = word2.toLowerCase();

    // Exact match
    if (w1 === w2) return true;

    // Substring match
    if (w1.includes(w2) || w2.includes(w1)) return true;

    // Levenshtein distance for typos
    const distance = this.levenshteinDistance(w1, w2);
    return distance <= 2;
  }

  /**
   * Levenshtein distance for string similarity
   */
  static levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Calculate confidence level based on score
   */
  static calculateConfidence(score) {
    if (score >= 80) return "HIGH";
    if (score >= 50) return "MEDIUM";
    return "LOW";
  }

  /**
   * Generate score justification (reasoning)
   */
  static generateJustification(score, breakdown) {
    const reasons = [];

    if (breakdown.skillsMatch >= 70) {
      reasons.push(
        `Strong skills alignment (${breakdown.skillsMatch}%) with job requirements.`
      );
    } else if (breakdown.skillsMatch >= 40) {
      reasons.push(
        `Moderate skills match (${breakdown.skillsMatch}%). Consider upskilling in missing areas.`
      );
    } else {
      reasons.push(
        `Limited skills overlap (${breakdown.skillsMatch}%). Significant skill development needed.`
      );
    }

    if (breakdown.experienceMatch >= 70) {
      reasons.push("Sufficient professional experience level.");
    }

    if (breakdown.keywordsMatch >= 60) {
      reasons.push("Good resume-to-JD keyword alignment.");
    }

    if (breakdown.industryRelevance >= 50) {
      reasons.push("Strong industry relevance indicators.");
    }

    return reasons;
  }
}

module.exports = ScoringEngine;

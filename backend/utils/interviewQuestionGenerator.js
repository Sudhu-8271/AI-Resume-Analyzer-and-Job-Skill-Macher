/**
 * DYNAMIC INTERVIEW QUESTION GENERATOR
 * Generates unlimited, resume-specific interview questions
 * Based on: Skills, Projects, Experience, Education, Job Description
 */

class InterviewQuestionGenerator {
  /**
   * Generate comprehensive interview questions
   */
  static generateInterviewQuestions(resumeData, jobDescription = "") {
    return {
      technical: this.generateTechnicalQuestions(resumeData),
      behavioral: this.generateBehavioralQuestions(resumeData),
      project: this.generateProjectQuestions(resumeData),
      scenario: this.generateScenarioQuestions(resumeData, jobDescription),
      leadership: this.generateLeadershipQuestions(resumeData),
      hr: this.generateHRQuestions(resumeData, jobDescription),
      company: this.generateCompanySpecificQuestions(jobDescription),
    };
  }

  /**
   * Generate technical questions from skills and experience
   */
  static generateTechnicalQuestions(resumeData) {
    const { skills = [], experience = {} } = resumeData;
    const questions = [];

    // Skill-specific questions
    const technicalSkills = [
      "javascript",
      "python",
      "java",
      "react",
      "node",
      "sql",
      "mongodb",
      "docker",
      "kubernetes",
      "aws",
      "machine learning",
      "data science",
      "graphql",
      "rest api",
    ];

    const foundSkills = skills.filter((s) =>
      technicalSkills.some((ts) => s.toLowerCase().includes(ts))
    );

    // JavaScript questions
    if (this.hasSkill(skills, "javascript")) {
      questions.push(
        ...this.getJavaScriptQuestions().map((q) => ({
          ...q,
          difficulty: "Medium",
        }))
      );
    }

    // Python questions
    if (this.hasSkill(skills, "python")) {
      questions.push(
        ...this.getPythonQuestions().map((q) => ({
          ...q,
          difficulty: "Medium",
        }))
      );
    }

    // React questions
    if (this.hasSkill(skills, "react")) {
      questions.push(
        ...this.getReactQuestions().map((q) => ({
          ...q,
          difficulty: "Medium",
        }))
      );
    }

    // Database questions
    if (
      this.hasSkill(skills, "sql") ||
      this.hasSkill(skills, "mongodb")
    ) {
      questions.push(
        ...this.getDatabaseQuestions().map((q) => ({
          ...q,
          difficulty: "Medium",
        }))
      );
    }

    // Cloud/DevOps questions
    if (
      this.hasSkill(skills, "aws") ||
      this.hasSkill(skills, "docker") ||
      this.hasSkill(skills, "kubernetes")
    ) {
      questions.push(
        ...this.getCloudQuestions().map((q) => ({
          ...q,
          difficulty: "Hard",
        }))
      );
    }

    // System design questions
    if (experience.years >= 5) {
      questions.push(
        ...this.getSystemDesignQuestions().map((q) => ({
          ...q,
          difficulty: "Hard",
        }))
      );
    }

    return questions.slice(0, 15); // Return max 15 questions
  }

  /**
   * Generate behavioral questions
   */
  static generateBehavioralQuestions(resumeData) {
    return [
      {
        category: "Behavioral",
        question: "Tell me about a challenging project you worked on. How did you handle it?",
        hint: "Reference actual projects from your resume",
        difficulty: "Easy",
      },
      {
        category: "Behavioral",
        question:
          "Describe a time when you had to learn a new technology quickly.",
        hint: "Use specific examples from your experience",
        difficulty: "Easy",
      },
      {
        category: "Behavioral",
        question:
          "How do you handle disagreements with team members or managers?",
        hint: "Use STAR method: Situation, Task, Action, Result",
        difficulty: "Medium",
      },
      {
        category: "Behavioral",
        question:
          "Tell me about a time you made a mistake at work and how you resolved it.",
        hint: "Show accountability and learning",
        difficulty: "Medium",
      },
      {
        category: "Behavioral",
        question: "How do you prioritize tasks when you have multiple deadlines?",
        hint: "Explain your methodology",
        difficulty: "Easy",
      },
      {
        category: "Behavioral",
        question:
          "Describe your experience working in an Agile/Scrum environment.",
        hint: "Reference actual sprint experiences",
        difficulty: "Medium",
      },
      {
        category: "Behavioral",
        question:
          "How do you stay updated with latest technologies and trends?",
        hint: "Mention courses, communities, side projects",
        difficulty: "Easy",
      },
      {
        category: "Behavioral",
        question:
          "Tell me about a time you contributed beyond your job description.",
        hint: "Show initiative and ownership",
        difficulty: "Medium",
      },
    ];
  }

  /**
   * Generate project-specific questions
   */
  static generateProjectQuestions(resumeData) {
    const questions = [];

    // Generic project questions
    const projectQuestions = [
      "Walk me through one of your most significant projects.",
      "What was your role and contribution in this project?",
      "What challenges did you face and how did you overcome them?",
      "If you could redesign that project, what would you do differently?",
      "How did you measure the success of that project?",
      "Tell me about the tech stack you used and why you chose it.",
      "How did you collaborate with other team members on this project?",
      "What did you learn from working on this project?",
    ];

    return projectQuestions.map((q, i) => ({
      category: "Project",
      question: q,
      difficulty: i % 2 === 0 ? "Medium" : "Hard",
    }));
  }

  /**
   * Generate scenario-based questions
   */
  static generateScenarioQuestions(resumeData, jobDescription) {
    return [
      {
        category: "Scenario",
        question:
          "If you were given an undefined project requirement, how would you proceed?",
        hint: "Ask clarifying questions, break down the problem",
        difficulty: "Hard",
      },
      {
        category: "Scenario",
        question:
          "A critical bug is found in production 30 minutes before you leave. What do you do?",
        hint: "Show priority management and responsibility",
        difficulty: "Medium",
      },
      {
        category: "Scenario",
        question:
          "You're assigned a task you've never done before. How do you approach it?",
        hint: "Show learning ability and resourcefulness",
        difficulty: "Medium",
      },
      {
        category: "Scenario",
        question:
          "How would you optimize a slow database query that's impacting performance?",
        hint: "Discuss indexing, query optimization, caching",
        difficulty: "Hard",
      },
      {
        category: "Scenario",
        question: "Your code review receives critical feedback. How do you respond?",
        hint: "Show professionalism and growth mindset",
        difficulty: "Medium",
      },
    ];
  }

  /**
   * Generate leadership questions
   */
  static generateLeadershipQuestions(resumeData) {
    return [
      {
        category: "Leadership",
        question:
          "Tell me about a time you led a team or project. What was your approach?",
        hint: "Describe your leadership style",
        difficulty: "Hard",
      },
      {
        category: "Leadership",
        question:
          "How do you mentor junior developers or team members?",
        hint: "Show commitment to team growth",
        difficulty: "Medium",
      },
      {
        category: "Leadership",
        question:
          "Describe your experience with code reviews and how you provide constructive feedback.",
        hint: "Show balance of helpfulness and standards",
        difficulty: "Medium",
      },
      {
        category: "Leadership",
        question:
          "How do you handle a situation where you need to escalate issues?",
        hint: "Show communication skills",
        difficulty: "Medium",
      },
      {
        category: "Leadership",
        question:
          "Tell me about your experience with cross-functional collaboration.",
        hint: "Show ability to work with different teams",
        difficulty: "Hard",
      },
    ];
  }

  /**
   * Generate HR/Cultural questions
   */
  static generateHRQuestions(resumeData, jobDescription) {
    return [
      {
        category: "HR",
        question: "Why are you interested in this role/company?",
        hint: "Research the company and role",
        difficulty: "Easy",
      },
      {
        category: "HR",
        question: "What are your career goals for the next 5 years?",
        hint: "Be specific and aligned with the role",
        difficulty: "Easy",
      },
      {
        category: "HR",
        question: "What are your strengths and weaknesses?",
        hint: "Be honest and show self-awareness",
        difficulty: "Medium",
      },
      {
        category: "HR",
        question: "Where do you see yourself in this company in 3 years?",
        hint: "Show ambition but realistic expectations",
        difficulty: "Easy",
      },
      {
        category: "HR",
        question:
          "How do you handle stress and maintain work-life balance?",
        hint: "Show wellness awareness",
        difficulty: "Medium",
      },
      {
        category: "HR",
        question:
          "What is your expected salary range? (If applicable)",
        hint: "Research market rates",
        difficulty: "Easy",
      },
    ];
  }

  /**
   * Generate company-specific questions
   */
  static generateCompanySpecificQuestions(jobDescription) {
    const companyNames = (jobDescription.match(/company|at\s+(\w+)/gi) || [])
      .slice(0, 3);

    return [
      {
        category: "Company",
        question:
          "What do you know about our company's mission and values?",
        hint: "Research the company thoroughly",
        difficulty: "Easy",
      },
      {
        category: "Company",
        question: "Why do you want to work for our company specifically?",
        hint: "Show genuine interest",
        difficulty: "Medium",
      },
      {
        category: "Company",
        question:
          "How do our products/services align with your career interests?",
        hint: "Show industry knowledge",
        difficulty: "Medium",
      },
      {
        category: "Company",
        question:
          "What do you know about our technology stack and why is it interesting to you?",
        hint: "Show technical interest in the company",
        difficulty: "Hard",
      },
    ];
  }

  // ======== SKILL-SPECIFIC QUESTION BANKS ========

  static getJavaScriptQuestions() {
    return [
      {
        question: "Explain the difference between var, let, and const.",
        keyPoints: ["scope", "hoisting", "reassignment"],
      },
      {
        question: "What is closure? Provide an example.",
        keyPoints: ["inner function", "outer function scope", "data privacy"],
      },
      {
        question: "Explain async/await vs Promises.",
        keyPoints: ["readability", "error handling", "control flow"],
      },
      {
        question: "What is the event loop and how does it work?",
        keyPoints: ["call stack", "callback queue", "microtask queue"],
      },
      {
        question:
          "Explain the difference between == and ===.",
        keyPoints: ["type coercion", "strict equality"],
      },
      {
        question: "What are callback functions and what is callback hell?",
        keyPoints: ["callbacks", "nested callbacks", "solutions"],
      },
      {
        question: "Explain prototypal inheritance.",
        keyPoints: ["prototype chain", "object creation", "method lookup"],
      },
      {
        question: "What is the 'this' keyword and how does it work?",
        keyPoints: ["context", "binding", "arrow functions"],
      },
    ];
  }

  static getPythonQuestions() {
    return [
      {
        question: "What are list comprehensions and when would you use them?",
        keyPoints: ["syntax", "performance", "readability"],
      },
      {
        question: "Explain generators and yield keyword.",
        keyPoints: ["lazy evaluation", "memory efficiency", "use cases"],
      },
      {
        question: "What is the difference between @staticmethod and @classmethod?",
        keyPoints: ["decorators", "method types", "use cases"],
      },
      {
        question: "Explain decorators in Python.",
        keyPoints: ["function wrapping", "metaprogramming", "examples"],
      },
      {
        question: "What is the GIL (Global Interpreter Lock)?",
        keyPoints: ["threading", "performance", "workarounds"],
      },
      {
        question: "Explain virtual environments and why they're important.",
        keyPoints: ["dependency management", "isolation", "best practices"],
      },
    ];
  }

  static getReactQuestions() {
    return [
      {
        question: "Explain the component lifecycle in React.",
        keyPoints: ["mounting", "updating", "unmounting"],
      },
      {
        question: "What are hooks? Name some common hooks.",
        keyPoints: ["useState", "useEffect", "useContext", "custom hooks"],
      },
      {
        question: "Explain the difference between controlled and uncontrolled components.",
        keyPoints: ["form handling", "state management"],
      },
      {
        question: "What is the virtual DOM and how does it improve performance?",
        keyPoints: ["reconciliation", "diffing algorithm", "rendering"],
      },
      {
        question: "Explain the purpose of keys in React lists.",
        keyPoints: ["reconciliation", "performance", "order preservation"],
      },
      {
        question: "What are higher-order components (HOC)?",
        keyPoints: ["component logic reuse", "pattern", "alternatives"],
      },
    ];
  }

  static getDatabaseQuestions() {
    return [
      {
        question: "Explain the difference between SQL and NoSQL databases.",
        keyPoints: ["schema", "scalability", "use cases", "ACID vs BASE"],
      },
      {
        question: "What are indexes and why are they important?",
        keyPoints: ["query optimization", "trade-offs", "types"],
      },
      {
        question: "Explain normalization in databases.",
        keyPoints: ["normal forms", "data redundancy", "query efficiency"],
      },
      {
        question: "What are transactions and ACID properties?",
        keyPoints: ["atomicity", "consistency", "isolation", "durability"],
      },
      {
        question: "Explain different types of joins in SQL.",
        keyPoints: ["inner join", "outer join", "cross join", "self join"],
      },
    ];
  }

  static getCloudQuestions() {
    return [
      {
        question: "Explain the difference between IaaS, PaaS, and SaaS.",
        keyPoints: ["infrastructure", "platform", "software", "control level"],
      },
      {
        question: "What is containerization and why use Docker?",
        keyPoints: ["isolation", "portability", "microservices"],
      },
      {
        question: "Explain Kubernetes and container orchestration.",
        keyPoints: ["deployment", "scaling", "networking", "storage"],
      },
      {
        question: "What are AWS services you have used and their purposes?",
        keyPoints: ["EC2", "S3", "RDS", "Lambda", "VPC"],
      },
      {
        question: "Explain CI/CD pipelines and their benefits.",
        keyPoints: ["automation", "testing", "deployment", "tools"],
      },
    ];
  }

  static getSystemDesignQuestions() {
    return [
      {
        question: "Design a scalable URL shortener system.",
        keyPoints: ["database", "caching", "sharding", "DNS"],
      },
      {
        question: "Design a social media feed system.",
        keyPoints: ["database", "caching", "real-time updates", "ranking"],
      },
      {
        question: "Design a rate limiting system.",
        keyPoints: ["algorithms", "distributed systems", "edge cases"],
      },
      {
        question: "Design a search autocomplete system.",
        keyPoints: ["trie", "indexing", "caching", "latency"],
      },
    ];
  }

  /**
   * Helper: Check if skill exists
   */
  static hasSkill(skills, keyword) {
    return skills.some((s) =>
      s.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Get questions by difficulty level
   */
  static getQuestionsByDifficulty(allQuestions, difficulty) {
    return Object.values(allQuestions)
      .flat()
      .filter((q) => q.difficulty === difficulty);
  }

  /**
   * Shuffle questions
   */
  static shuffleQuestions(questions) {
    return questions.sort(() => Math.random() - 0.5);
  }
}

module.exports = InterviewQuestionGenerator;

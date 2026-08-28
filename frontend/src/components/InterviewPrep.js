import React, { useMemo } from "react";
import { useResume } from "../context/ResumeContext";

const questionSets = {
  javascript: [
    "Explain closure in JavaScript with a real project example.",
    "What happens in the event loop? Explain microtask vs macrotask.",
    "Difference between var, let, const with memory behavior.",
    "How does async/await work internally?",
    "Explain promise chaining with error handling.",
    "What is prototype inheritance in JS?",
    "How do you optimize a slow JavaScript app?",
  ],

  mongodb: [
    "What is indexing and how does it improve performance?",
    "Explain aggregation pipeline with example.",
    "When to use embedded vs referenced documents?",
    "What is sharding?",
    "Explain replica sets.",
    "How does MongoDB scale horizontally?",
    "How do you optimize slow queries?",
  ],

  python: [
    "What are decorators?",
    "Difference between list and tuple?",
    "What are generators?",
    "How does memory management work in Python?",
    "Shallow copy vs deep copy?",
    "What is GIL?",
    "How do you optimize Python code?",
  ],

  aws: [
    "Difference between EC2 and Lambda?",
    "What is S3 used for?",
    "Explain IAM roles.",
    "What is auto-scaling?",
    "How does load balancing work?",
    "Explain serverless architecture.",
    "How to design scalable AWS system?",
  ],

  html: [
    "What is semantic HTML?",
    "Explain box model.",
    "Difference between block and inline elements?",
    "How to improve SEO using HTML?",
    "What are meta tags?",
    "What is accessibility?",
    "How to structure a web page?",
  ],

  css: [
    "Flexbox vs Grid?",
    "What is specificity?",
    "How does cascade work?",
    "Responsive design techniques?",
    "What is z-index?",
    "What are media queries?",
    "How to optimize CSS?",
  ],

  java: [
    "OOP principles?",
    "JVM vs JRE vs JDK?",
    "What is garbage collection?",
    "What are threads?",
    "Explain synchronization.",
    "What is inheritance?",
    "What are interfaces?",
  ],

  git: [
    "git merge vs rebase?",
    "What is branching strategy?",
    "How to resolve conflicts?",
    "What is stash?",
    "What is commit history?",
    "What is pull request?",
    "How does version control help teams?",
  ],

  "web development": [
    "What is REST API?",
    "Client vs server rendering?",
    "How does frontend communicate with backend?",
    "What is authentication?",
    "What is caching?",
    "How to scale web app?",
    "What is MVC architecture?",
  ],
};

const fallbackQuestions = [
  "Explain this skill with a real project example.",
  "How would you debug a production issue?",
  "What challenges have you faced using this skill?",
  "How do you optimize performance?",
  "Describe a real-world use case.",
];

// Color mapping for different skills
const skillColors = {
  javascript: {
    heading: "text-cyan-400",
    bullet: "text-cyan-400",
  },
  mongodb: {
    heading: "text-green-400",
    bullet: "text-green-400",
  },
  python: {
    heading: "text-yellow-400",
    bullet: "text-yellow-400",
  },
  aws: {
    heading: "text-orange-400",
    bullet: "text-orange-400",
  },
  html: {
    heading: "text-red-400",
    bullet: "text-red-400",
  },
  css: {
    heading: "text-purple-400",
    bullet: "text-purple-400",
  },
  java: {
    heading: "text-red-500",
    bullet: "text-red-500",
  },
  git: {
    heading: "text-orange-500",
    bullet: "text-orange-500",
  },
  "web development": {
    heading: "text-white-400",
    bullet: "text-white-400",
  },
};

function getSkillColor(skill) {
  return skillColors[skill] || { heading: "text-gray-400", bullet: "text-gray-400" };
}

function generateQuestionsForSkill(skill) {
  const normalized = skill.toLowerCase().trim();
  const base = questionSets[normalized] || fallbackQuestions;
  
  // Return only first 7 questions
  return base.slice(0, 7);
}

function InterviewPrep() {
  const { resumeSkills: userSkills } = useResume();

  const normalizedSkills = useMemo(
    () =>
      Array.from(
        new Set(
          userSkills.map((s) => s.toLowerCase().trim()).filter(Boolean)
        )
      ),
    [userSkills]
  );

  const skillQuestionsMap = useMemo(() => {
    const map = {};

    normalizedSkills.forEach((skill) => {
      map[skill] = generateQuestionsForSkill(skill);
    });

    return map;
  }, [normalizedSkills]);

  return (
    <div className="card">
      <h2 className="text-2xl text-purple-400 mb-6">
        AI Dynamic Interview Preparation
      </h2>

      {normalizedSkills.length === 0 ? (
        <p className="text-gray-400">
          No resume analyzed yet. Please analyze your resume first on the
          Resume Analyzer page to get skill-based interview questions.
        </p>
      ) : (
        <>
          <h3 className="text-purple-400 mb-4">
            Detected Resume Skills
          </h3>

          <ul className="text-blue-400 mb-4">
            {normalizedSkills.map((skill, i) => (
              <li key={i}>• {skill}</li>
            ))}
          </ul>

          <h3 className="text-purple-400 mb-4">
            Skill-Based Interview Questions
          </h3>

          {Object.entries(skillQuestionsMap).map(([skill, questions]) => {
            const colors = getSkillColor(skill);
            return (
              <div key={skill} className="mb-6">
                <h4 className={`${colors.heading} mb-2`}>
                  {skill.toUpperCase()}
                </h4>

                <ul className="text-white">
                  {questions.map((q, i) => (
                    <li key={i} className={`mb-2 ${colors.bullet}`}>
                      • {q}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default InterviewPrep;
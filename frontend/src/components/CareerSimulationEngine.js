import React from "react";
import { useResume } from "../context/ResumeContext";

const careerPaths = {

  "Machine Learning Engineer": {
    requiredSkills: [
      "Python",
      "Statistics",
      "TensorFlow",
      "Deep Learning",
      "Data Engineering"
    ],
    time: "12 months",
    roadmap: [
      "Learn Statistics",
      "Learn Machine Learning",
      "Build ML Projects",
      "Apply for ML roles"
    ]
  },

  "Full Stack Developer": {
    requiredSkills: [
      "JavaScript",
      "React",
      "Node",
      "MongoDB",
      "System Design"
    ],
    time: "8 months",
    roadmap: [
      "Master JavaScript",
      "Learn React & Frontend",
      "Build Node.js APIs",
      "Develop Full Stack Projects"
    ]
  },

  "DevOps Engineer": {
    requiredSkills: [
      "Linux",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "AWS"
    ],
    time: "10 months",
    roadmap: [
      "Learn Linux Fundamentals",
      "Master Docker Containers",
      "Understand Kubernetes",
      "Deploy Projects on Cloud"
    ]
  },

  "Data Scientist": {
    requiredSkills: [
      "Python",
      "Statistics",
      "Pandas",
      "Machine Learning",
      "Data Visualization"
    ],
    time: "11 months",
    roadmap: [
      "Learn Statistics & Math",
      "Master Python for Data",
      "Build Data Science Projects",
      "Work with Real Datasets"
    ]
  }

};

function normalizeSkill(skill) {
  return String(skill || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function skillsMatch(userSkill, requiredSkill) {
  const u = normalizeSkill(userSkill);
  const r = normalizeSkill(requiredSkill);

  if (!u || !r) return false;

  return u.includes(r) || r.includes(u);
}

function findMatchingRequiredSkills(userSkills, requiredSkills) {
  return requiredSkills.filter((requiredSkill) =>
    userSkills.some((userSkill) => skillsMatch(userSkill, requiredSkill))
  );
}

function CareerSimulationEngine() {
  const {
  resumeSkills: userSkills,
  careerGoal,
  setCareerGoal,
  careerSimulationResult: careerResult,
  setCareerSimulationResult: setCareerResult,
} = useResume();

  const suggestedCareers = Object.keys(careerPaths).filter((career) => {
    const required = careerPaths[career].requiredSkills;

    return findMatchingRequiredSkills(userSkills, required).length > 0;
  });

  function simulateCareer() {

    const path = careerPaths[careerGoal];

    if (!path) return;

    const matchedRequiredSkills = findMatchingRequiredSkills(
      userSkills,
      path.requiredSkills
    );

    const missingSkills = path.requiredSkills.filter(
      (skill) => !matchedRequiredSkills.includes(skill)
    );

    setCareerResult({
      requiredSkills: path.requiredSkills,
      missingSkills,
      roadmap: path.roadmap,
      time: path.time
    });

  }

  return (

    <div className="card">

      <h2 className="text-2xl text-purple-400 mb-6">
        AI Career Simulation Engine
      </h2>

      {userSkills.length === 0 ? (
        <p className="text-gray-400 mb-6">
          No resume analyzed yet. Please analyze your resume first on the
          Resume Analyzer page to get career suggestions based on your
          actual skills.
        </p>
      ) : suggestedCareers.length === 0 ? (
        <p className="text-gray-400 mb-6">
          No matching career paths found for your current skills yet. Try
          adding more technical skills to your resume, or pick from all
          available paths below.
        </p>
      ) : (
        <>
          <h3 className="text-purple-400 mb-3">
            Suggested Careers
          </h3>

          <ul className="text-green-400 mb-6">
            {suggestedCareers.map((career, index) => (
              <li key={index}>• {career}</li>
            ))}
          </ul>
        </>
      )}

      {userSkills.length > 0 && (
        <>
          <select
            className="bg-black border border-purple-500 p-3 mb-6 w-full"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
          >
            <option value="">Select Career Goal</option>

            {Object.keys(careerPaths).map((career) => (
              <option key={career} value={career}>
                {career}
              </option>
            ))}

          </select>

          <button
            onClick={simulateCareer}
            disabled={!careerGoal}
            className="bg-purple-600 px-6 py-2 rounded hover:bg-purple-700 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simulate Career
          </button>
        </>
      )}

      {careerResult && (

        <div>

          <h3 className="text-purple-400 mb-2">
            Your Skills
          </h3>

          <ul className="text-blue-400 mb-4">
            {userSkills.map((skill, index) => (
              <li key={index}>• {skill}</li>
            ))}
          </ul>

          <h3 className="text-purple-400 mb-2">
            Missing Skills
          </h3>

          {careerResult.missingSkills.length === 0 ? (
            <p className="text-green-400 mb-4">
              You already have all the required skills for this path!
            </p>
          ) : (
            <ul className="text-red-400 mb-4">
              {careerResult.missingSkills.map((skill, index) => (
                <li key={index}>• {skill}</li>
              ))}
            </ul>
          )}

          <h3 className="text-purple-400 mb-2">
            Estimated Learning Time
          </h3>

          <p className="text-white mb-6">
            {careerResult.time}
          </p>

          <h3 className="text-purple-400 mb-2">
            Career Roadmap
          </h3>

          <ul className="text-yellow-400">
            {careerResult.roadmap.map((step, index) => (
              <li key={index}>
                Step {index + 1}: {step}
              </li>
            ))}
          </ul>

        </div>

      )}

    </div>

  );
}

export default CareerSimulationEngine;
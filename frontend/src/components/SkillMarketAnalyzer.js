import React from "react";
import SkillDemandChart from "./SkillDemandChart";

function SkillMarketAnalyzer({ userSkills = [] }) {
  const resumeSkills = Array.from(
    new Set(userSkills.map((skill) => skill.toLowerCase().trim()).filter(Boolean))
  );

  const marketSkills = [
    "javascript",
    "python",
    "java",
    "c#",
    "php",
    "android",
    "html",
    "jquery",
  ];

  const missingSkills = marketSkills.filter(
    (skill) => !resumeSkills.includes(skill.toLowerCase())
  );

  return (

    <div>

      <div className="card">

        <h2 className="text-2xl text-purple-400 mb-6">
          AI Skill Market Analyzer
        </h2>

        <h3 className="text-purple-400 mb-3">
          Your Resume Skills
        </h3>

        <ul className="text-blue-400 mb-6">
          {resumeSkills.map((skill, index) => (
            <li key={index}>• {skill}</li>
          ))}
        </ul>

        <h3 className="text-purple-400 mb-3">
          Trending Market Skills
        </h3>

        <ul className="text-green-400 mb-6">
          {marketSkills.map((skill, index) => (
            <li key={index}>• {skill}</li>
          ))}
        </ul>

        <h3 className="text-purple-400 mb-3">
          Market Demand Gap
        </h3>

        <ul className="text-red-400">
          {missingSkills.map((skill, index) => (
            <li key={index}>• {skill}</li>
          ))}
        </ul>

      </div>

      <SkillDemandChart skills={marketSkills} />

    </div>

  );
}

export default SkillMarketAnalyzer;
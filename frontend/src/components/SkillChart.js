import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

function SkillChart({ resumeSkills = [], jobSkills = [], resumeText = "" }) {

  const text = (resumeText || "").toLowerCase();

  // ✅ FIX: escape regex special characters
  const escapeRegExp = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const allSkills =
    resumeSkills.length > 0 || jobSkills.length > 0
      ? [...new Set([...resumeSkills, ...jobSkills])]
      : [
          "javascript",
          "react",
          "node",
          "express",
          "mongodb",
          "docker",
          "aws",
          "kubernetes",
          "redis",
          "typescript"
        ];

  const data = allSkills.map((skill) => {
    const lower = skill.toLowerCase();

    // ✅ FIXED regex (no \b, escaped input)
    const safeSkill = escapeRegExp(lower);

    const occurrences =
      (text.match(new RegExp(safeSkill, "gi")) || []).length;

    const contextBonus =
      /project|implemented|developed|led|worked on|experience|responsible for/i.test(text)
        ? 5
        : 0;

    const resumeScore = Math.min(
      95,
      Math.round(Math.min(1, occurrences / 2) * 55 + 40 + contextBonus)
    );

    const jobScore = jobSkills.includes(skill) ? 100 : 30;

    return {
      skill,
      resume: resumeSkills.includes(skill) ? resumeScore : 20,
      job: jobScore,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "#020617",
            border: "1px solid #a855f7",
            borderRadius: "8px",
            padding: "10px",
            color: "#fff"
          }}
        >
          <p style={{ fontWeight: "bold" }}>{label}</p>

          <p style={{ color: "#a855f7" }}>
            Resume Skills : {payload[0].value}
          </p>

          <p style={{ color: "#22d3ee" }}>
            Job Required Skills : {payload[1].value}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        width: "100%",
        height: "520px",
        background: "#020617",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 0 40px rgba(168,85,247,0.6)"
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius="75%" data={data}>
          <PolarGrid stroke="#9333ea" />

          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "#ffffff", fontSize: 12 }}
          />

          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#c4b5fd" }} />

          <Tooltip content={<CustomTooltip />} />

          <Radar
            name="Resume Skills"
            dataKey="resume"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.55}
            strokeWidth={2}
          />

          <Radar
            name="Job Required Skills"
            dataKey="job"
            stroke="#22d3ee"
            fill="#22d3ee"
            fillOpacity={0.35}
            strokeWidth={2}
          />

          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SkillChart;
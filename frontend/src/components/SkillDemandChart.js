import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function SkillDemandChart({ skills }) {

  const data = skills.map((skill, index) => ({
    skill: skill,
    demand: 100 - index * 7
  }));

  return (

    <div className="card mt-8">

      <h3 className="text-purple-400 text-xl mb-4">
        Skill Market Demand Heatmap
      </h3>

      <ResponsiveContainer width="100%" height={320}>

        <BarChart data={data} layout="vertical">

          <XAxis type="number" />

          <YAxis
            type="category"
            dataKey="skill"
          />

          <Tooltip />

          <Bar
            dataKey="demand"
            fill="#9333ea"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );
}

export default SkillDemandChart;
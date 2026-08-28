import React from "react"; 
 
function CareerAdvisor({ userSkills = [] }) { 
 
  const suggestions = []; 

  // Only for matching: keeps the original displayed userSkills unchanged
  const normalizedSkills = userSkills.map((skill) =>
    String(skill || "").toLowerCase().trim()
  );
 
  if (normalizedSkills.includes("react") || normalizedSkills.includes("javascript")) { 
    suggestions.push("Full Stack Developer"); 
  } 
 
  if (normalizedSkills.includes("python") || normalizedSkills.includes("machine learning")) { 
    suggestions.push("Machine Learning Engineer"); 
  } 
 
  if (normalizedSkills.includes("docker") || normalizedSkills.includes("kubernetes")) { 
    suggestions.push("DevOps Engineer"); 
  } 
 
  if (normalizedSkills.includes("python") && normalizedSkills.includes("statistics")) { 
    suggestions.push("Data Scientist"); 
  } 
 
  return ( 
 
    <div className="card"> 
 
      <h2 className="text-2xl text-purple-400 mb-6"> 
        AI Career Advisor 
      </h2> 
 
      <h3 className="text-purple-400 mb-3"> 
        Your Detected Skills 
      </h3> 
 
      <ul className="text-blue-400 mb-6"> 
        {userSkills.map((skill, index) => ( 
          <li key={index}>• {skill}</li> 
        ))} 
      </ul> 
 
      <h3 className="text-purple-400 mb-3"> 
        Recommended Career Paths 
      </h3> 
 
      <ul className="text-green-400"> 
        {suggestions.map((career, index) => ( 
          <li key={index}>• {career}</li> 
        ))} 
      </ul> 
 
    </div> 
 
  ); 
} 
 
export default CareerAdvisor;
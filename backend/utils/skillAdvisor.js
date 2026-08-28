const skillRecommendations = {

  docker: "Learn Docker containerization and deploy applications using Docker.",

  aws: "Learn AWS cloud services like EC2, S3 and deployment.",

  mongodb: "Practice MongoDB CRUD operations and database design.",

  react: "Build React projects and learn hooks, routing and state management.",

  node: "Learn Node.js backend development and API creation.",

  javascript: "Strengthen JavaScript fundamentals like ES6, promises and async programming.",

  machinelearning: "Study machine learning algorithms and Python libraries like scikit-learn."

};

function getRecommendations(missingSkills){

  const recommendations = [];

  missingSkills.forEach(skill => {

    if(skillRecommendations[skill]){
      recommendations.push({
        skill: skill,
        advice: skillRecommendations[skill]
      });
    }

  });

  return recommendations;

}

module.exports = getRecommendations;
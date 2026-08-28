import React, {
  createContext,
  useContext,
  useState,
} from "react";

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {

  // ============================================================
  // RESUME / JOB DESCRIPTION
  // (No longer persisted to localStorage - resets on every
  // page refresh, and is cleared on logout via clearResumeData)
  // ============================================================

  const [jobDescription, setJobDescription] = useState("");

  const [analysisResults, setAnalysisResults] = useState(null);

  // ============================================================
  // CAREER GOAL
  // ============================================================

  const [careerGoal, setCareerGoal] = useState("");

  // ============================================================
  // AI CAREER ADVISOR RESULT
  // ============================================================

  const [careerAdvisorResult, setCareerAdvisorResult] =
    useState(null);

  // ============================================================
  // CAREER SIMULATION RESULT
  // ============================================================

  const [
    careerSimulationResult,
    setCareerSimulationResult,
  ] = useState(null);

  // ============================================================
  // RESUME SKILLS
  // ============================================================

  const resumeSkills =
    analysisResults?.resumeSkills || [];

  // ============================================================
  // CLEAR ALL RESUME DATA
  // ============================================================

  const clearResumeData = () => {
    setAnalysisResults(null);
    setJobDescription("");
    setCareerGoal("");

    // Clear AI Advisor
    setCareerAdvisorResult(null);

    // Clear Career Simulation
    setCareerSimulationResult(null);
  };

  // ============================================================
  // CLEAR ONLY CAREER ADVISOR
  // ============================================================

  const clearCareerAdvisorResult = () => {
    setCareerAdvisorResult(null);
  };

  // ============================================================
  // CLEAR ONLY CAREER SIMULATION
  // ============================================================

  const clearCareerSimulationResult = () => {
    setCareerSimulationResult(null);
  };

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value = {
    // Resume
    jobDescription,
    setJobDescription,

    analysisResults,
    setAnalysisResults,

    resumeSkills,

    // Career Goal
    careerGoal,
    setCareerGoal,

    // AI Career Advisor
    careerAdvisorResult,
    setCareerAdvisorResult,
    clearCareerAdvisorResult,

    // Career Simulation
    careerSimulationResult,
    setCareerSimulationResult,
    clearCareerSimulationResult,

    // Clear everything
    clearResumeData,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);

  if (!ctx) {
    throw new Error(
      "useResume must be used within a ResumeProvider"
    );
  }

  return ctx;
}

export default ResumeContext;
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import SkillChart from "./SkillChart";
import AuthContext from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";

const API_BASE_URLS = [
  process.env.REACT_APP_API_URL,
  "http://localhost:5000",
  "http://localhost:5001",
].filter(Boolean);

async function postToApi(path, payload, config = {}) {
  let lastError;

  for (const base of API_BASE_URLS) {
    try {
      return await axios.post(`${base}${path}`, payload, config);
    } catch (error) {
      lastError = error;

      if (error.response) {
        throw error;
      }

      if (
        error.code !== "ECONNREFUSED" &&
        error.code !== "EHOSTUNREACH" &&
        error.code !== "ERR_NETWORK"
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

function ResumeUpload() {
  const auth = useContext(AuthContext);

  const token =
    auth?.token || localStorage.getItem("authToken");

  const {
    jobDescription,
    setJobDescription,
    analysisResults,
    setAnalysisResults,
  } = useResume();

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [animatedScore, setAnimatedScore] =
    useState(0);

  const [showChatbot, setShowChatbot] =
    useState(false);

  const [scanStep, setScanStep] =
    useState("");

  const [typedAnalysis, setTypedAnalysis] =
    useState("");

  const [userInput, setUserInput] =
    useState("");

  // NEW: Error message state for inline display
  const [errorMessage, setErrorMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text:
        "Hello! Ask me anything about your resume.",
    },
  ]);

  useEffect(() => {
    if (
      analysisResults &&
      typeof analysisResults.matchScore === "number" &&
      analysisResults.matchScore >= 0
    ) {
      let start = 0;

      setAnimatedScore(0);

      const interval = setInterval(() => {
        start++;

        if (start >= analysisResults.matchScore) {
          start = analysisResults.matchScore;
          clearInterval(interval);
        }

        setAnimatedScore(start);
      }, 20);

      return () => clearInterval(interval);
    }
  }, [analysisResults]);

  useEffect(() => {
    if (!analysisResults?.aiAnalysis) return;

    const cleanedText = String(
      analysisResults.aiAnalysis
    )
      .replace(
        /Match Score\s*\(?\s*\**\s*\d+%\s*\**\s*\)?\s*:?\s*/gi,
        ""
      )
      .replace(
        /\(?\s*\**\s*\d+%\s*\**\s*\)?/g,
        ""
      )
      .replace(
        /\**Match Score.*?\**/gi,
        ""
      )
      .trim();

    if (!cleanedText) return;

    let index = 0;

    setTypedAnalysis("");

    const interval = setInterval(() => {
      setTypedAnalysis((prev) => {
        return prev + cleanedText.charAt(index);
      });

      index++;

      if (index >= cleanedText.length) {
        clearInterval(interval);
      }
    }, 12);

    return () => clearInterval(interval);
  }, [analysisResults]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      selectedFile.type !==
      "application/pdf"
    ) {
      setErrorMessage("Please upload a PDF resume only.");
      e.target.value = "";
      setFile(null);
      // Clear error after 4 seconds
      setTimeout(() => setErrorMessage(""), 4000);
      return;
    }

    setFile(selectedFile);
    setErrorMessage(""); // Clear any previous errors
  };

  const handleUpload = async () => {
    // FIXED: Show inline message instead of alert
    if (!file) {
      setErrorMessage("Please upload a resume first.");
      // Clear error after 4 seconds
      setTimeout(() => setErrorMessage(""), 4000);
      return;
    }

    if (!token) {
      setErrorMessage(
        "You are not logged in. Please login again."
      );
      setTimeout(() => setErrorMessage(""), 4000);
      return;
    }

    setErrorMessage(""); // Clear any previous errors

    setAnalysisResults(null);
    setTypedAnalysis("");
    setAnimatedScore(0);
    setShowChatbot(false);

    setMessages([
      {
        sender: "ai",
        text:
          "Hello! Ask me anything about your resume.",
      },
    ]);

    const formData = new FormData();

    formData.append("resume", file);

    formData.append(
      "jobDescription",
      jobDescription || ""
    );

    try {
      setLoading(true);

      setScanStep(
        "🤖 Initializing AI engine..."
      );

      const timer1 = setTimeout(() => {
        setScanStep(
          "📄 Parsing resume document..."
        );
      }, 800);

      const timer2 = setTimeout(() => {
        setScanStep(
          "🧠 Extracting skills using NLP..."
        );
      }, 1600);

      const timer3 = setTimeout(() => {
        setScanStep(
          "⚡ AI is deeply analyzing your resume..."
        );
      }, 2400);

      console.log(
        "Sending /analyze request with token:",
        !!token
      );

      const response = await postToApi(
        "/analyze",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const data = response.data;

      console.log(
        "Resume analysis response:",
        data
      );

      setTimeout(() => {
        setAnalysisResults(data);

        setAnimatedScore(0);

        setScanStep("✅ Analysis complete!");

        setLoading(false);
      }, 800);
    } catch (error) {
      console.error(
        "Resume analysis error:",
        error
      );

      setLoading(false);
      setScanStep("");

      if (error.response?.status === 401) {
        setErrorMessage(
          "Unauthorized: Your login session/token is invalid or expired. Please login again."
        );
        setTimeout(() => setErrorMessage(""), 5000);
        return;
      }

      if (error.response?.status === 403) {
        setErrorMessage(
          "Access denied. You don't have permission to analyze this resume."
        );
        setTimeout(() => setErrorMessage(""), 5000);
        return;
      }

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error analyzing resume"
      );
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    if (!analysisResults) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "Please analyze your resume first.",
        },
      ]);

      return;
    }

    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "Your login session has expired. Please login again.",
        },
      ]);

      return;
    }

    const currentInput = userInput;

    const userMessage = {
      sender: "user",
      text: currentInput,
    };

    setUserInput("");

    const newChatHistory = [
      ...messages,
      userMessage,
    ];

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        sender: "ai",
        text: "typing...",
      },
    ]);

    try {
      const response = await postToApi(
        "/api",
        {
          message: currentInput,

          resumeText:
            analysisResults?.resumeText || "",

          jobDescription:
            jobDescription || "",

          chatHistory: newChatHistory,

          resumeSkills:
            analysisResults?.resumeSkills ||
            [],

          matchedSkills:
            analysisResults?.matchedSkills ||
            [],

          missingSkills:
            analysisResults?.missingSkills ||
            [],

          matchScore:
            analysisResults?.matchScore || 0,

          jdSkills:
            analysisResults?.jdSkills || [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      let aiReply =
        response.data.reply ??
        response.data.response ??
        "No response from AI";

      if (typeof aiReply === "string") {
        try {
          const parsed = JSON.parse(aiReply);

          aiReply =
            parsed.aiAnalysis ||
            parsed.suggestions?.join("\n") ||
            aiReply;
        } catch (e) {
          // Normal text response
        }
      } else if (
        typeof aiReply === "object" &&
        aiReply !== null
      ) {
        aiReply =
          aiReply.aiAnalysis ||
          aiReply.suggestions?.join("\n") ||
          String(aiReply);
      }

      setMessages((prev) => {
        const updated = [...prev];

        updated.pop();

        updated.push({
          sender: "ai",
          text: aiReply,
        });

        return updated;
      });
    } catch (error) {
      console.error(
        "Chatbot error:",
        error
      );

      setMessages((prev) => {
        const updated = [...prev];

        updated.pop();

        updated.push({
          sender: "ai",
          text:
            error.response?.status === 401
              ? "❌ Unauthorized. Please login again."
              : "❌ AI server error",
        });

        return updated;
      });
    }
  };

  const report =
    analysisResults?.analysisReport || {};

  const careerRisk =
    report?.careerRiskAnalysis || {};

  const marketReadiness =
    report?.marketReadinessScore || {};

  const hiringProbability =
    report?.hiringProbability || {};

  return (
    <div className="card">

      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#38bdf8",
            marginBottom: "8px",
            textShadow:
              "0 0 12px rgba(56,189,248,0.6)",
          }}
        >
          Upload Your Resume
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            marginBottom: "18px",
          }}
        >
          Upload your resume to analyze
          skills and match them with the
          job requirements.
        </p>

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border:
              "1px solid #9333ea",
            background: "#020617",
            color: "white",
            cursor: "pointer",
          }}
        />

        {file && (
          <div
            style={{
              marginTop: "10px",
              color: "#22c55e",
              fontSize: "14px",
            }}
          >
           🗂️ File uploaded: {file.name}
          </div>
        )}

        {/* NEW: Inline error message display */}
        {errorMessage && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              fontSize: "14px",
              textAlign: "center",
              animation: "fadeIn 0.3s ease",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}
      </div>

      <br />

      <textarea
        rows="6"
        placeholder="Paste Job Description"
        value={jobDescription}
        onChange={(e) =>
          setJobDescription(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border:
            "1px solid #9333ea",
          background: "#020617",
          color: "white",
          boxSizing: "border-box",
        }}
      />

      <br />
      <br />

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          padding: "12px 30px",
          borderRadius: "10px",
          border: "none",
          background: loading
            ? "#64748b"
            : "linear-gradient(90deg,#9333ea,#ec4899)",
          color: "white",
          fontWeight: "bold",
          cursor: loading
            ? "not-allowed"
            : "pointer",
          boxShadow:
            "0 0 20px rgba(147,51,234,0.5)",
        }}
      >
        {loading
          ? "Analyzing..."
          : "Analyze Resume"}
      </button>

      {loading && (
        <div
          style={{
            marginTop: "30px",
            textAlign: "center",
            fontSize: "18px",
            color: "#facc15",
            letterSpacing: "1px",
          }}
        >
          {scanStep}
        </div>
      )}

      {analysisResults && (
        <div
          style={{
            marginTop: "40px",
          }}
        >

          <div className="neon-card">
            <h3>
              Match Score
            </h3>

            <div
              style={{
                background: "#1e1b4b",
                borderRadius: "20px",
                height: "30px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${animatedScore}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg,#9333ea,#ec4899)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  color: "white",
                  fontWeight: "bold",
                  transition:
                    "width 0.3s ease",
                }}
              >
                {animatedScore}%
              </div>
            </div>
          </div>

          <div className="neon-card">
            <h2
              style={{
                fontSize: "30px",
                fontWeight: "700",
                color: "#38bdf8",
                marginBottom: "20px",
              }}
            >
              Skill Compatibility Map
            </h2>

            <SkillChart
              resumeSkills={
                analysisResults.resumeSkills ||
                []
              }
              jobSkills={
                analysisResults.jdSkills ||
                []
              }
              resumeText={
                analysisResults?.resumeText ||
                ""
              }
            />
          </div>

          <div
            className="neon-card"
            style={{
              marginTop: "30px",
              boxShadow:
                "0 0 25px rgba(147,51,234,0.4)",
            }}
          >
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#38bdf8",
                marginBottom: "15px",
              }}
            >
              🤖 AI Resume Analysis Report
            </h2>

            {analysisResults.analysisReport ? (
              <div
                style={{
                  display: "grid",
                  gap: "18px",
                  textAlign: "left",
                }}
              >

                <div
                  style={{
                    background: "#111827",
                    padding: "18px",
                    borderRadius: "16px",
                    border:
                      "1px solid #4f46e5",
                  }}
                >
                  <h3>
                    📊 Performance Summary
                  </h3>

                  <ul
                    style={{
                      paddingLeft: "20px",
                      margin: 0,
                      lineHeight: 1.9,
                    }}
                  >
                    <li>
                      - Match Score:{" "}
                      {report.matchScore ??
                        analysisResults.matchScore ??
                        "N/A"}
                      %
                    </li>

                    <li>
                      - ATS Score:{" "}
                      {report.atsScore ??
                        "N/A"}
                    </li>

                    <li>
                      - Market Readiness:{" "}
                      {marketReadiness.score ??
                        "N/A"}{" "}
                      / 100
                    </li>

                    <li>
                      - Hiring Probability:{" "}
                      {hiringProbability.probability ??
                        "N/A"}
                      %
                    </li>
                  </ul>
                </div>

                <div
                  style={{
                    background: "#111827",
                    padding: "18px",
                    borderRadius: "16px",
                    border:
                      "1px solid #4f46e5",
                  }}
                >
                  <h3>
                    🔍 Skills Overview
                  </h3>

                  <ul
                    style={{
                      paddingLeft: "20px",
                      margin: 0,
                      lineHeight: 1.9,
                    }}
                  >
                    <li>
                      🧠 Matched Skills (
                      {
                        (
                          report.matchedSkills ||
                          []
                        ).length
                      }
                      )
                    </li>

                    {(
                      report.matchedSkills ||
                      []
                    )
                      .slice(0, 6)
                      .map(
                        (skill, index) => (
                          <li
                            key={`matched-${index}`}
                          >
                            - {skill}
                          </li>
                        )
                      )}

                    <li
                      style={{
                        marginTop: "10px",
                      }}
                    >
                      🧩 Missing Skills (
                      {
                        (
                          report.missingSkills ||
                          []
                        ).length
                      }
                      )
                    </li>

                    {(
                      report.missingSkills ||
                      []
                    )
                      .slice(0, 6)
                      .map(
                        (skill, index) => (
                          <li
                            key={`missing-${index}`}
                          >
                            - {skill}
                          </li>
                        )
                      )}
                  </ul>
                </div>

                <div
                  style={{
                    background: "#111827",
                    padding: "18px",
                    borderRadius: "16px",
                    border:
                      "1px solid #4f46e5",
                  }}
                >
                  <h3>
                    💼 Recommended Jobs
                  </h3>

                  <ul
                    style={{
                      paddingLeft: "20px",
                      margin: 0,
                      lineHeight: 1.9,
                    }}
                  >
                    {(
                      report.recommendedJobs ||
                      []
                    ).length > 0 ? (
                      report.recommendedJobs.map(
                        (item, index) => (
                          <li key={index}>
                            - {item}
                          </li>
                        )
                      )
                    ) : (
                      <li>
                        - No recommended jobs
                        available
                      </li>
                    )}
                  </ul>
                </div>

                <div
                  style={{
                    background: "#111827",
                    padding: "18px",
                    borderRadius: "16px",
                    border:
                      "1px solid #4f46e5",
                  }}
                >
                  <h3>
                    ⚠️ Career Risks
                  </h3>

                  <ul
                    style={{
                      paddingLeft: "20px",
                      margin: 0,
                      lineHeight: 1.9,
                    }}
                  >
                    <li>
                      - Risk Score:{" "}
                      {careerRisk.riskScore ??
                        0}
                      /100
                    </li>

                    <li>
                      - Risk Level:{" "}
                      {careerRisk.level ||
                        "Medium"}
                    </li>

                    <li
                      style={{
                        marginTop: "10px",
                      }}
                    >
                      ✔ Key Issues:
                    </li>

                    {(
                      careerRisk.factors ||
                      []
                    ).length > 0 ? (
                      careerRisk.factors.map(
                        (
                          factor,
                          index
                        ) => (
                          <li
                            key={`factor-${index}`}
                          >
                            - {factor}
                          </li>
                        )
                      )
                    ) : (
                      <>
                        <li>
                          - Critical skill gaps
                          in modern frameworks
                        </li>

                        <li>
                          - Limited real-world
                          experience
                        </li>
                      </>
                    )}

                    <li
                      style={{
                        marginTop: "10px",
                      }}
                    >
                      ✔ Action Plan:
                    </li>

                    {(
                      careerRisk.mitigation ||
                      []
                    ).length > 0 ? (
                      careerRisk.mitigation
                        .slice(0, 4)
                        .map(
                          (
                            item,
                            index
                          ) => (
                            <li
                              key={`mitigation-${index}`}
                            >
                              - {item}
                            </li>
                          )
                        )
                    ) : (
                      <>
                        <li>
                          - Learn React + Node +
                          Express
                        </li>

                        <li>
                          - Build 2 real-world
                          projects
                        </li>

                        <li>
                          - Improve backend API
                          skills
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div
                  style={{
                    background: "#111827",
                    padding: "18px",
                    borderRadius: "16px",
                    border:
                      "1px solid #4f46e5",
                  }}
                >
                  <h3>
                    📈 Resume Improvements
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <h4>
                        Skill Improvements
                      </h4>

                      <ul
                        style={{
                          paddingLeft: "20px",
                          lineHeight: 1.8,
                        }}
                      >
                        <li>
                          - Learn React for frontend
                          development
                        </li>

                        <li>
                          - Learn Node.js + Express
                          for backend APIs
                        </li>

                        <li>
                          - Practice REST API
                          development
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4>
                        Profile Improvements
                      </h4>

                      <ul
                        style={{
                          paddingLeft: "20px",
                          lineHeight: 1.8,
                        }}
                      >
                        <li>
                          - Add 2–3 real-world
                          projects
                        </li>

                        <li>
                          - Upload GitHub portfolio
                        </li>

                        <li>
                          - Add measurable
                          achievements
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4>
                        ATS Improvements
                      </h4>

                      <ul
                        style={{
                          paddingLeft: "20px",
                          lineHeight: 1.8,
                        }}
                      >
                        <li>
                          - Optimize keywords for job
                          descriptions
                        </li>

                        <li>
                          - Improve project
                          descriptions
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#111827",
                    padding: "18px",
                    borderRadius: "16px",
                    border:
                      "1px solid #4f46e5",
                  }}
                >
                  <h3>
                    🎯 Final Suggestion
                  </h3>

                  <ul
                    style={{
                      paddingLeft: "20px",
                      lineHeight: 1.9,
                    }}
                  >
                    <li>
                      - Focus on MERN stack mastery
                    </li>

                    <li>
                      - Build full-stack real
                      projects
                    </li>

                    <li>
                      - Strengthen backend API
                      development
                    </li>

                    <li>
                      - Apply for internships or
                      entry-level developer roles
                    </li>

                    <li>
                      - Continuously update GitHub
                    </li>
                  </ul>
                </div>

              </div>
            ) : (
              <div
                style={{
                  background: "#0f172a",
                  padding: "20px",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                  border:
                    "1px solid #9333ea",
                  minHeight: "200px",
                }}
              >
                No analysis available.
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (showChatbot) {
                setShowChatbot(false);

                setMessages([
                  {
                    sender: "ai",
                    text:
                      "Hello! Ask me anything about your resume.",
                  },
                ]);

                setUserInput("");
              } else {
                setShowChatbot(true);
              }
            }}
            style={{
              marginTop: "20px",
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              background:
                "linear-gradient(90deg,#9333ea,#ec4899)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {showChatbot
              ? "AI Chatbot (Close)"
              : "AI Career Assistant (Open)"}
          </button>

          {showChatbot && (
            <div className="neon-card">

              <h3>
                AI Career Assistant
              </h3>

              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginBottom: "20px",
                }}
              >
                {messages.map(
                  (msg, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign:
                          msg.sender ===
                          "user"
                            ? "right"
                            : "left",
                        margin: "12px 0",
                      }}
                    >
                      <span
                        style={{
                          background:
                            msg.sender ===
                            "user"
                              ? "linear-gradient(90deg,#9333ea,#ec4899)"
                              : "#1e293b",

                          padding:
                            "10px 16px",

                          borderRadius:
                            "14px",

                          display:
                            "inline-block",

                          maxWidth: "70%",

                          color: "white",

                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {msg.text ===
                        "typing..." ? (
                          <div
                            style={{
                              display:
                                "flex",
                              gap: "5px",
                              alignItems:
                                "center",
                            }}
                          >
                            <span className="dot">
                              .
                            </span>

                            <span className="dot">
                              .
                            </span>

                            <span className="dot">
                              .
                            </span>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <input
                  value={userInput}
                  onChange={(e) =>
                    setUserInput(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask AI about your resume..."
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border:
                      "1px solid #9333ea",
                    background: "#020617",
                    color: "white",
                  }}
                />

                <button
                  onClick={handleSend}
                  style={{
                    padding:
                      "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      "#9333ea",
                    color: "white",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
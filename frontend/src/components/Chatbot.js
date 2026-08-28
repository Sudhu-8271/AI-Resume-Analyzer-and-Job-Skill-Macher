import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE_URLS = [
  process.env.REACT_APP_API_URL,
  "http://localhost:5000",
  "http://localhost:5001"
].filter(Boolean);

async function postToApi(path, payload, config = {}) {
  let lastError;

  for (const base of API_BASE_URLS) {
    try {
      return await axios.post(`${base}${path}`, payload, config);
    } catch (error) {
      lastError = error;
      if (
        error.code !== "ECONNREFUSED" &&
        error.code !== "EHOSTUNREACH" &&
        error.response
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

function normalizeChatbotResponse(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return text.trim();
  }

  const normalized = lines.map((line) => {
    if (/^(✔|\*|-|\d+\.)/.test(line)) {
      return line;
    }

    return `- ${line}`;
  });

  return normalized.join("\n");
}

function Chatbot({ analysisResults }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: analysisResults
        ? `Resume analyzed successfully.

ATS Score: ${analysisResults.matchScore}%

Matched Skills:
${analysisResults.matchedSkills?.join(", ") || "None"}

You can ask:
• Which job suits me?
• Ask interview questions
• What skills should I learn?
• Improve my resume`
        : "Upload and analyze your resume first."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userText
      }
    ]);

    setInput("");
    setLoading(true);

    try {
      if (!analysisResults) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Please analyze your resume first."
          }
        ]);
        setLoading(false);
        return;
      }

      const response = await postToApi("/api", {
        message: userText,
        resumeText: analysisResults?.resumeText || "",
        jobDescription: analysisResults?.jobDescription || "",
        chatHistory: messages,
        resumeSkills: analysisResults?.resumeSkills || [],
        missingSkills: analysisResults?.missingSkills || [],
        matchedSkills: analysisResults?.matchedSkills || [],
        matchScore: analysisResults?.matchScore || 0,
        jdSkills: analysisResults?.jdSkills || []
      });

      const reply = response.data?.reply ?? response.data?.response;

      let botText = "No response from AI";

      if (typeof reply === "string") {
        botText = reply;
      } else if (Array.isArray(reply?.aiAnalysis)) {
        botText = reply.aiAnalysis
          .map((item, index) => `${index + 1}. ${item}`)
          .join("\n");
      } else if (typeof reply === "object" && reply !== null) {
        botText =
          reply.aiAnalysis ||
          (reply.suggestions
            ? reply.suggestions.join("\n")
            : "") ||
          String(reply) ||
          "No response from AI";
      }

      botText = normalizeChatbotResponse(botText);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botText
        }
      ]);
    } catch (error) {
      console.error("Chatbot Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "❌ AI server error"
        }
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      className="card"
      style={{
        maxWidth: "900px",
        margin: "0 auto"
      }}
    >
      <h2
        style={{
          marginBottom: "20px",
          color: "#c084fc"
        }}
      >
        AI Career Assistant
      </h2>

      {analysisResults && (
        <p
          style={{
            color: "#94a3b8",
            marginBottom: "10px"
          }}
        >
          ATS Score: {analysisResults.matchScore}% (From Resume Analysis)
        </p>
      )}

      {/* CHAT AREA */}
      <div
        style={{
          minHeight: "300px",
          maxHeight: "400px",
          overflowY: "auto",
          padding: "15px",
          border: "1px solid #9333ea",
          borderRadius: "10px",
          background: "#0f172a",
          marginBottom: "20px"
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.sender === "user"
                  ? "flex-end"
                  : "flex-start",
              marginBottom: "15px"
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "12px",
                borderRadius: "12px",
                background:
                  msg.sender === "user"
                    ? "#9333ea"
                    : "#1e293b",
                color: "white",
                whiteSpace: "pre-line"
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "15px"
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "12px",
                borderRadius: "12px",
                background: "#1e293b",
                color: "white"
              }}
            >
              AI is typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          gap: "10px"
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
            padding: "14px",
            background: "#020617",
            border: "1px solid #9333ea",
            borderRadius: "10px",
            color: "white"
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: "14px 24px",
            background: "#9333ea",
            border: "none",
            borderRadius: "10px",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProfileMenu from "./ProfileMenu";

export default function Navbar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const location = useLocation();

  // Hide navbar on auth pages
  const authPaths = [
    "/login",
    "/signup",
    "/verify-otp",
    "/forgot-password",
  ];

  if (authPaths.includes(location.pathname)) return null;

  const navItem = (label, to) => (
    <button
      onClick={() => navigate(to)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        borderRadius: "10px",
        marginBottom: "12px",
        border: "none",
        cursor: "pointer",
        color: "white",
        fontSize: "15px",
        fontWeight: "500",
        position: "relative",
        background:
          location.pathname === to
            ? "linear-gradient(90deg,#9333ea,#ec4899)"
            : "transparent",
        boxShadow:
          location.pathname === to
            ? "0 0 12px rgba(168,85,247,0.7)"
            : "none",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => {
        if (location.pathname !== to) {
          e.currentTarget.style.background =
            "rgba(168,85,247,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (location.pathname !== to) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {label}

      {/* Active page glow bar */}
      {location.pathname === to && (
        <span
          style={{
            position: "absolute",
            left: "-8px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "4px",
            height: "70%",
            background: "#a855f7",
            borderRadius: "4px",
            boxShadow: "0 0 10px #a855f7",
          }}
        />
      )}
    </button>
  );

  return (
    <div
      style={{
        width: open ? "260px" : "70px",
        transition: "0.3s",
        background: "#020617",
        padding: "22px",
        height: "100vh",
        borderRight: "1px solid rgba(168,85,247,0.3)",
        boxShadow: "0 0 20px rgba(168,85,247,0.3)",
        position: "relative",
        zIndex: "20",
        boxSizing: "border-box",
      }}
    >
      {/* Hamburger Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "25px",
        }}
      >
        <button
          onClick={() => setOpen(!open)}
          style={{
            background:
              "linear-gradient(90deg,#9333ea,#ec4899)",
            border: "none",
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            cursor: "pointer",
            boxShadow:
              "0 0 15px rgba(168,85,247,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "20px" }}>
            <div
              style={{
                height: "2px",
                background: "white",
                marginBottom: "5px",
              }}
            />

            <div
              style={{
                height: "2px",
                background: "white",
                marginBottom: "5px",
              }}
            />

            <div
              style={{
                height: "2px",
                background: "white",
              }}
            />
          </div>
        </button>
      </div>

      {/* Navigation */}
      {open && (
        <>
          {/* Home */}
          {navItem("Home", "/home")}

          <hr
            style={{
              borderColor:
                "rgba(168,85,247,0.3)",
              margin: "20px 0",
            }}
          />

          {/* AI Tools Section */}
          <div
            style={{
              marginBottom: "12px",
              fontSize: "13px",
              color: "#38bdf8",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "1px",
              textShadow:
                "0 0 8px rgba(56,189,248,0.7)",
            }}
          >
            AI Tools
          </div>

          <div style={{ paddingLeft: "6px" }}>
            {navItem(
              "AI Career Advisor",
              "/advisor"
            )}

            {navItem(
              "Skill Market Analyzer",
              "/skill-market"
            )}

            {navItem(
              "Career Simulation",
              "/simulation"
            )}

            {navItem(
              "Interview Preparation",
              "/interview-preparation"
            )}

            {navItem(
              "Mock Interview",
              "/mock-interview"
            )}

            {/* Profile */}
            <div
              style={{
                marginTop: "22px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {token ? (
                <ProfileMenu />
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#10b981",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
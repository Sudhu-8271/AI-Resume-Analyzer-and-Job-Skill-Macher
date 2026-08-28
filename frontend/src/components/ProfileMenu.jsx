import React, {
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";

import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import {
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);

  const { user, logout } = useContext(AuthContext);

  const navigate = useNavigate();

  const menuRef = useRef(null);

  // ============================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ============================================================
  // USERNAME
  // ============================================================

  const username =
    user?.name ||
    user?.username ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  // First letter of username

  const firstLetter = username
    .charAt(0)
    .toUpperCase();

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    setOpen(false);

    await logout();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      {/* ======================================================
          PROFILE BUTTON
      ====================================================== */}

      <button
        onClick={() => setOpen(!open)}
        style={{
          minWidth: "150px",
          maxWidth: "210px",
          height: "44px",

          padding: "0 14px",

          borderRadius: "24px",

          border:
            "1px solid rgba(168,85,247,0.75)",

          background:
            "linear-gradient(135deg,#9333ea,#ec4899)",

          color: "white",

          fontSize: "14px",

          fontWeight: "600",

          cursor: "pointer",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          gap: "8px",

          boxShadow:
            "0 0 16px rgba(168,85,247,0.55)",

          transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
        }}

        onMouseEnter={(e) => {
          e.currentTarget.style.transform =
            "scale(1.04)";

          e.currentTarget.style.boxShadow =
            "0 0 24px rgba(236,72,153,0.75)";
        }}

        onMouseLeave={(e) => {
          e.currentTarget.style.transform =
            "scale(1)";

          e.currentTarget.style.boxShadow =
            "0 0 16px rgba(168,85,247,0.55)";
        }}
      >

        {/* ==================================================
            USER AVATAR
        ================================================== */}

        <span
          style={{
            width: "27px",
            height: "27px",

            minWidth: "27px",

            borderRadius: "50%",

            background:
              "rgba(255,255,255,0.2)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            fontSize: "12px",

            fontWeight: "700",
          }}
        >
          {firstLetter}
        </span>

        {/* ==================================================
            USERNAME
        ================================================== */}

        <span
          style={{
            overflow: "hidden",

            textOverflow: "ellipsis",

            whiteSpace: "nowrap",

            maxWidth: "125px",
          }}
        >
          {username}
        </span>

        {/* ==================================================
            DROPDOWN ARROW
        ================================================== */}

        <ChevronDown
          size={15}
          style={{
            transform: open
              ? "rotate(180deg)"
              : "rotate(0deg)",

            transition:
              "transform 0.2s ease",

            flexShrink: 0,
          }}
        />

      </button>


      {/* ======================================================
          DROPDOWN MENU
      ====================================================== */}

      {open && (
        <div
          style={{
            position: "absolute",

            top: "54px",

            left: "50%",

            transform: "translateX(-50%)",

            width: "190px",

            background:
              "rgba(15,23,42,0.98)",

            border:
              "1px solid rgba(168,85,247,0.4)",

            borderRadius: "14px",

            padding: "8px",

            boxShadow:
              "0 12px 35px rgba(0,0,0,0.5)",

            backdropFilter: "blur(12px)",

            zIndex: 1000,
          }}
        >

          {/* ==================================================
              PROFILE
          ================================================== */}

          <button
            onClick={() => {
              setOpen(false);

              navigate("/profile");
            }}

            style={menuStyle}

            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "rgba(168,85,247,0.18)";
            }}

            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
            }}
          >

            <User size={17} />

            <span>
              Profile
            </span>

          </button>


          {/* ==================================================
              SETTINGS
          ================================================== */}

          <button
            onClick={() => {
              setOpen(false);

              navigate("/settings");
            }}

            style={menuStyle}

            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "rgba(168,85,247,0.18)";
            }}

            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
            }}
          >

            <Settings size={17} />

            <span>
              Settings
            </span>

          </button>


          {/* ==================================================
              DIVIDER
          ================================================== */}

          <div
            style={{
              height: "1px",

              background:
                "rgba(168,85,247,0.2)",

              margin: "6px 4px",
            }}
          />


          {/* ==================================================
              LOGOUT
          ================================================== */}

          <button
            onClick={handleLogout}

            style={{
              ...menuStyle,

              color: "#ef4444",
            }}

            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "rgba(239,68,68,0.12)";
            }}

            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
            }}
          >

            <LogOut size={17} />

            <span>
              Logout
            </span>

          </button>

        </div>
      )}

    </div>
  );
}


// ============================================================
// MENU STYLE
// ============================================================

const menuStyle = {
  width: "100%",

  padding: "11px 12px",

  border: "none",

  borderRadius: "9px",

  background: "transparent",

  color: "white",

  textAlign: "left",

  fontSize: "14px",

  cursor: "pointer",

  display: "flex",

  alignItems: "center",

  gap: "10px",

  transition:
    "background 0.2s ease",
};
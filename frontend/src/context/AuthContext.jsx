import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const RESUME_STORAGE_KEY = "resumeAnalyzerState";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("authToken")
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ============================================================
  // SAVE TOKEN
  // ============================================================

  const saveToken = useCallback((newToken) => {
    if (!newToken) {
      return;
    }

    localStorage.setItem("authToken", newToken);

    setToken(newToken);
  }, []);

  // ============================================================
  // CLEAR AUTH
  // ============================================================

  const clearAuth = useCallback(() => {
    localStorage.removeItem("authToken");

    setToken(null);

    setUser(null);
  }, []);

  // ============================================================
  // CLEAR RESUME STORAGE
  // ============================================================

  const clearResumeStorage = useCallback(() => {
    try {
      localStorage.removeItem(
        RESUME_STORAGE_KEY
      );
    } catch (error) {
      console.warn(
        "Could not clear resume data:",
        error
      );
    }
  }, []);

  // ============================================================
  // CLEAR ALL USER DATA
  // ============================================================

  const clearAllUserData = useCallback(() => {
    clearAuth();

    clearResumeStorage();
  }, [
    clearAuth,
    clearResumeStorage,
  ]);

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  const refreshAccessToken = useCallback(
    async () => {
      try {
        const response = await fetch(
          "/auth/refresh",
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!response.ok) {
          clearAuth();

          return null;
        }

        const data =
          await response.json();

        if (!data.token) {
          clearAuth();

          return null;
        }

        saveToken(data.token);

        return data.token;
      } catch (error) {
        console.warn(
          "Token refresh failed:",
          error
        );

        clearAuth();

        return null;
      }
    },
    [
      clearAuth,
      saveToken,
    ]
  );

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  const fetchCurrentUser = useCallback(
    async (currentToken) => {
      if (!currentToken) {
        setUser(null);

        return false;
      }

      try {
        let response = await fetch(
          "/auth/me",
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },

            credentials: "include",
          }
        );

        // ======================================================
        // TOKEN EXPIRED
        // ======================================================

        if (response.status === 401) {
          const newToken =
            await refreshAccessToken();

          if (!newToken) {
            return false;
          }

          response = await fetch(
            "/auth/me",
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },

              credentials: "include",
            }
          );
        }

        if (!response.ok) {
          return false;
        }

        const data =
          await response.json();

        // ======================================================
        // SET USER
        // ======================================================

        if (data.user) {
          setUser(data.user);

          return true;
        }

        return false;
      } catch (error) {
        console.warn(
          "Fetch current user failed:",
          error
        );

        return false;
      }
    },
    [refreshAccessToken]
  );

  // ============================================================
  // INITIAL AUTH CHECK
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        const storedToken =
          localStorage.getItem(
            "authToken"
          );

        if (!storedToken) {
          if (mounted) {
            setUser(null);

            setLoading(false);
          }

          return;
        }

        const success =
          await fetchCurrentUser(
            storedToken
          );

        if (
          !success &&
          mounted
        ) {
          clearAllUserData();
        }

        if (mounted) {
          setLoading(false);
        }
      };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [
    fetchCurrentUser,
    clearAllUserData,
  ]);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = useCallback(
    async (
      newToken,
      redirectTo
    ) => {
      if (!newToken) {
        return;
      }

      // --------------------------------------------------------
      // STEP 1: Save token
      // --------------------------------------------------------

      saveToken(newToken);

      // --------------------------------------------------------
      // STEP 2: Immediately fetch logged-in user
      // --------------------------------------------------------

      const success =
        await fetchCurrentUser(
          newToken
        );

      // --------------------------------------------------------
      // STEP 3: If user fetch failed
      // --------------------------------------------------------

      if (!success) {
        console.warn(
          "Login successful but user information could not be loaded."
        );
      }

      // --------------------------------------------------------
      // STEP 4: Redirect
      // --------------------------------------------------------

      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate("/home");
      }
    },
    [
      saveToken,
      fetchCurrentUser,
      navigate,
    ]
  );

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = useCallback(
    async () => {
      try {
        await fetch(
          "/auth/logout",
          {
            method: "POST",
            credentials: "include",
          }
        );
      } catch (error) {
        console.warn(
          "Logout request failed:",
          error
        );
      }

      // Clear everything
      clearAllUserData();

      navigate("/login");
    },
    [
      clearAllUserData,
      navigate,
    ]
  );

  // ============================================================
  // CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,

        login,

        logout,

        refreshAccessToken,

        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
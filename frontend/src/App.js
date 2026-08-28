import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import ResumeUpload from './components/ResumeUpload';
import CareerAdvisor from './components/CareerAdvisor';
import SkillMarketAnalyzer from './components/SkillMarketAnalyzer';
import CareerSimulationEngine from './components/CareerSimulationEngine';
import InterviewPrep from './components/InterviewPrep';
import Navbar from './components/Navbar';
import AIBrainBackground from './components/AIBrainBackground';
// ✅ CORRECT: Default import for AIMockInterview
import AIMockInterview from './components/AIMockInterview';
import OTPVerification from './components/auth/OTPVerification';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

import { AuthProvider } from './context/AuthContext';
import { ResumeProvider, useResume } from './context/ResumeContext';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';


// ============================================================
// HOME
// ============================================================

function HomePage() {
  return (
    <div>
      <h1 className="text-5xl font-extrabold text-center mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        AI Resume Analyzer & Skill Matcher
      </h1>

      <p className="text-center mb-10 text-gray-300">
        Analyze resumes, detect skills, and match candidates with jobs using AI.
      </p>

      <ResumeUpload />
    </div>
  );
}


// ============================================================
// PROTECTED PAGES
// ============================================================

function ResumeAnalyzerPage() {
  return <ResumeUpload />;
}

function AdvisorPage() {
  const { resumeSkills } = useResume();

  return <CareerAdvisor userSkills={resumeSkills} />;
}

function SimulationPage() {
  return <CareerSimulationEngine />;
}

function MarketAnalyzerPage() {
  const { resumeSkills } = useResume();

  return <SkillMarketAnalyzer userSkills={resumeSkills} />;
}

function InterviewPrepPage() {
  return <InterviewPrep />;
}


// ============================================================
// PUBLIC AUTH LAYOUT
// ============================================================

function PublicAuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black text-white">
      {children}
    </div>
  );
}


// ============================================================
// PROTECTED APP LAYOUT
// ============================================================

function ProtectedAppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-purple-900 to-black text-white">

      <AIBrainBackground />

      <Navbar />

      <div className="flex-1 p-10 relative z-10">
        {children}
      </div>

    </div>
  );
}


// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <ResumeProvider>

          <Routes>

            {/* ==================================================
                PUBLIC AUTH ROUTES
                ================================================== */}

            <Route
              path="/login"
              element={
                <PublicAuthLayout>
                  <LoginPage />
                </PublicAuthLayout>
              }
            />

            <Route
              path="/signup"
              element={
                <PublicAuthLayout>
                  <SignupPage />
                </PublicAuthLayout>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <PublicAuthLayout>
                  <ForgotPasswordPage />
                </PublicAuthLayout>
              }
            />

            <Route
              path="/reset-password"
              element={
                <PublicAuthLayout>
                  <ResetPasswordPage />
                </PublicAuthLayout>
              }
            />

            <Route
              path="/verify-otp"
              element={
                <PublicAuthLayout>
                  <OTPVerification />
                </PublicAuthLayout>
              }
            />


            {/* ==================================================
                DEFAULT
                ================================================== */}

            <Route
              path="/"
              element={
                <Navigate
                  to="/login"
                  replace
                />
              }
            />


            {/* ==================================================
                PROTECTED APP ROUTES
                ================================================== */}

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <HomePage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/resume-analyzer"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <ResumeAnalyzerPage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/advisor"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <AdvisorPage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/simulation"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <SimulationPage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/skill-market"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <MarketAnalyzerPage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/interview-preparation"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <InterviewPrepPage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/mock-interview"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <AIMockInterview />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <ProfilePage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout>
                    <SettingsPage />
                  </ProtectedAppLayout>
                </ProtectedRoute>
              }
            />


            {/* ==================================================
                FALLBACK
                ================================================== */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/login"
                  replace
                />
              }
            />

          </Routes>

        </ResumeProvider>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;
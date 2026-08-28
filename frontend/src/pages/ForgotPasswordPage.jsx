import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const getApiUrl = () =>
  process.env.REACT_APP_API_URL || 'http://localhost:5001';


// ============================================================
// TOAST NOTIFICATION SYSTEM
// Replaces alert() with an auto-dismissing message like a
// real website. No "OK" click required.
// ============================================================

let toastIdCounter = 0;

function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3500) => {
    if (!message) return;

    const id = ++toastIdCounter;

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return { toasts, showToast };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-[calc(100%-2.5rem)] max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-[fadeInSlide_0.25s_ease-out] rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm text-sm font-medium ${
            toast.type === 'error'
              ? 'border-red-500/40 bg-red-950/90 text-red-100'
              : toast.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100'
              : 'border-purple-500/40 bg-slate-900/95 text-slate-100'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ))}

      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


// ============================================================
// DETECT EMAIL VS PHONE
// ============================================================

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^\+?[0-9\s()-]{7,20}$/.test(value);
}


export default function ForgotPassword() {
  const navigate = useNavigate();

  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const { toasts, showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanContact = contact.trim();

    if (!cleanContact) {
      showToast(
        'Please enter your registered email or phone number.',
        'error'
      );
      return;
    }

    const detectedMode = isEmail(cleanContact)
      ? 'email'
      : isPhone(cleanContact)
      ? 'phone'
      : null;

    if (!detectedMode) {
      showToast(
        'Please enter a valid email address or phone number.',
        'error'
      );
      return;
    }

    setLoading(true);

    try {
      const apiUrl = getApiUrl();

      const payload =
        detectedMode === 'email'
          ? {
              email: cleanContact,
              purpose: 'password_reset',
            }
          : {
              phone: cleanContact,
              purpose: 'password_reset',
            };

      const response = await fetch(
        `${apiUrl}/auth/request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      if (!response.ok) {
        showToast(
          data.error ||
            data.message ||
            'Unable to send reset instructions. Please try again.',
          'error'
        );
        return;
      }

      showToast(
        data.message ||
          'Verification OTP has been sent successfully.',
        'success'
      );

      // ------------------------------------------------------
      // IMPORTANT:
      // OTP screen par ja rahe hain.
      // Email/phone + mode ResetPasswordPage ko pass kar rahe hain.
      // ------------------------------------------------------

      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            contact: cleanContact,
            mode: detectedMode,
            email:
              detectedMode === 'email'
                ? cleanContact
                : '',
            phone:
              detectedMode === 'phone'
                ? cleanContact
                : '',
          },
        });
      }, 600);
    } catch (error) {
      console.error(
        'Forgot password error:',
        error
      );

      showToast(
        'Unable to send reset instructions. Please check your connection and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">

      <ToastContainer toasts={toasts} />

      <div className="w-full max-w-xl rounded-[28px] border border-purple-500/20 bg-slate-950/90 p-6 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-sm md:p-8">

        {/* HEADER */}

        <div className="mb-8">

          <div className="mb-4 inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-200">
            Resume Analyzer
          </div>

          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Forgot Password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Enter your registered email or phone number.
            We will send you a verification OTP.
          </p>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-200">
              Registered Email or Phone Number
            </label>

            <input
              type="text"
              value={contact}
              onChange={(e) =>
                setContact(e.target.value)
              }
              placeholder="Enter your registered email or phone number"
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />

          </div>

          {/* SEND OTP */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Sending OTP...'
              : 'Send OTP'}
          </button>

        </form>

        {/* BACK TO LOGIN */}

        <div className="mt-7 text-center text-sm text-slate-300">

          <Link
            to="/login"
            className="font-semibold text-purple-300 transition-colors hover:text-purple-200"
          >
            ← Back to Login
          </Link>

        </div>

      </div>

    </div>
  );
}
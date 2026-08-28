import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';


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


export default function ResetPasswordPage() {
  const location = useLocation();

  const apiUrl =
    process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const { toasts, showToast } = useToast();

  // ----------------------------------------------------------
  // CONTACT RECEIVED FROM FORGOT PASSWORD PAGE
  // ----------------------------------------------------------

  const contactFromState =
    location.state?.contact || '';

  const modeFromState =
    location.state?.mode ||
    'email';

  const emailFromState =
    location.state?.email || '';

  const phoneFromState =
    location.state?.phone || '';

  // ----------------------------------------------------------
  // STEP
  //
  // otp      = ONLY OTP SCREEN
  // password = ONLY NEW PASSWORD SCREEN
  // success  = SUCCESS SCREEN
  // ----------------------------------------------------------

  const [step, setStep] = useState('otp');

  const [mode] = useState(modeFromState);

  const [form, setForm] = useState({
    email: emailFromState,
    phone: phoneFromState,
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);

  const [success, setSuccess] = useState(false);

  // ----------------------------------------------------------
  // CONTACT
  // ----------------------------------------------------------

  const contact =
    mode === 'phone'
      ? form.phone.trim()
      : form.email.trim() || contactFromState;

  // ----------------------------------------------------------
  // FORM CHANGE
  // ----------------------------------------------------------

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ==========================================================
  // STEP 1
  // VERIFY OTP
  // ==========================================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const cleanOtp = form.otp.trim();

    if (!contact) {
      showToast(
        mode === 'phone'
          ? 'Phone number is missing.'
          : 'Email address is missing.',
        'error'
      );
      return;
    }

    if (!cleanOtp) {
      showToast('Please enter the OTP.', 'error');
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      showToast('Please enter a valid 6-digit OTP.', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        otp: cleanOtp,
        purpose: 'password_reset',
      };

      if (mode === 'phone') {
        payload.phone = contact;
      } else {
        payload.email = contact;
      }

      const response = await fetch(
        `${apiUrl}/auth/verify-reset-otp`,
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
            'Invalid or expired OTP. Please try again.',
          'error'
        );
        return;
      }

      // ======================================================
      // VERY IMPORTANT
      //
      // OTP verification SUCCESS ke baad hi:
      //
      // step = password
      //
      // Isse OTP screen par password fields render nahi hongi.
      // ======================================================

      setStep('password');

      showToast(
        data.message ||
          'OTP verified successfully. Now create your new password.',
        'success'
      );
    } catch (error) {
      console.error(
        'Verify OTP error:',
        error
      );

      showToast(
        'Unable to verify OTP. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  const handleResendOtp = async () => {
    if (!contact) {
      showToast(
        mode === 'phone'
          ? 'Phone number is missing.'
          : 'Email address is missing.',
        'error'
      );
      return;
    }

    setResending(true);

    try {
      const payload =
        mode === 'phone'
          ? {
              phone: contact,
              purpose: 'password_reset',
            }
          : {
              email: contact,
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
            'Unable to resend OTP.',
          'error'
        );
        return;
      }

      setForm((prev) => ({
        ...prev,
        otp: '',
      }));

      showToast(
        data.message ||
          'A new OTP has been sent.',
        'success'
      );
    } catch (error) {
      console.error(
        'Resend OTP error:',
        error
      );

      showToast(
        'Unable to resend OTP. Please try again.',
        'error'
      );
    } finally {
      setResending(false);
    }
  };

  // ==========================================================
  // STEP 2
  // RESET PASSWORD
  // ==========================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!contact) {
      showToast(
        mode === 'phone'
          ? 'Phone number is missing.'
          : 'Email address is missing.',
        'error'
      );
      return;
    }

    if (!form.newPassword) {
      showToast('Please enter your new password.', 'error');
      return;
    }

    if (form.newPassword.length < 8) {
      showToast(
        'Password must be at least 8 characters.',
        'error'
      );
      return;
    }

    if (!form.confirmPassword) {
      showToast(
        'Please confirm your new password.',
        'error'
      );
      return;
    }

    if (
      form.newPassword !==
      form.confirmPassword
    ) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        otp: form.otp.trim(),
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      };

      if (mode === 'phone') {
        payload.phone = contact;
      } else {
        payload.email = contact;
      }

      const response = await fetch(
        `${apiUrl}/auth/reset-password`,
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
            'Unable to reset password. Please try again.',
          'error'
        );
        return;
      }

      setSuccess(true);

      showToast(
        data.message ||
          'Password reset successfully. You can now login.',
        'success'
      );
    } catch (error) {
      console.error(
        'Reset password error:',
        error
      );

      showToast(
        'Unable to reset password. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SUCCESS
  // ==========================================================

  if (success) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">

        <ToastContainer toasts={toasts} />

        <div className="w-full max-w-xl rounded-[28px] border border-purple-500/20 bg-slate-950/90 p-6 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-sm md:p-8">

          <div className="mb-6">

            <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-200">
              Resume Analyzer
            </span>

          </div>

          <div className="text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl text-emerald-400">
              ✓
            </div>

            <h1 className="mt-6 text-3xl font-bold text-white md:text-4xl">
              Password Reset Successful
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Your password has been changed successfully.
              You can now login using your new password.
            </p>

          </div>

          <div className="mt-8">

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01]"
            >
              Login
            </Link>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">

      <ToastContainer toasts={toasts} />

      <div className="w-full max-w-xl rounded-[28px] border border-purple-500/20 bg-slate-950/90 p-6 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-sm md:p-8">

        {/* HEADER */}

        <div className="mb-6">

          <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-200">
            Resume Analyzer
          </span>

        </div>

        <h1 className="text-3xl font-bold text-white md:text-4xl">

          {step === 'otp'
            ? 'Verify OTP'
            : 'Create New Password'}

        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">

          {step === 'otp'
            ? `Enter the 6-digit OTP sent to your registered ${
                mode === 'phone'
                  ? 'phone number'
                  : 'email address'
              }.`
            : 'Your OTP has been verified. You can now create a new password.'}

        </p>

        {/* STEP INDICATOR */}

        <div className="mt-7 flex items-center gap-2">

          <div
            className={`h-2 flex-1 rounded-full ${
              step === 'otp' ||
              step === 'password'
                ? 'bg-purple-500'
                : 'bg-slate-800'
            }`}
          />

          <div
            className={`h-2 flex-1 rounded-full ${
              step === 'password'
                ? 'bg-purple-500'
                : 'bg-slate-800'
            }`}
          />

        </div>

        <div className="mt-2 flex justify-between text-xs">

          <span
            className={
              step === 'otp'
                ? 'font-medium text-purple-300'
                : 'text-slate-500'
            }
          >
            Verify OTP
          </span>

          <span
            className={
              step === 'password'
                ? 'font-medium text-purple-300'
                : 'text-slate-500'
            }
          >
            New Password
          </span>

        </div>

        {/* ====================================================
            OTP SCREEN
            ONLY OTP HERE
        ==================================================== */}

        {step === 'otp' && (

          <form
            onSubmit={handleVerifyOtp}
            className="mt-8 space-y-5"
          >

            {/* REGISTERED CONTACT */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Registered Email or Phone
              </label>

              <input
                value={contact}
                readOnly
                className="w-full rounded-xl border border-purple-500/20 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none"
              />

            </div>

            {/* OTP */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Verification Code
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={form.otp}
                onChange={(e) =>
                  handleChange(
                    'otp',
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  )
                }
                placeholder="Enter 6-digit OTP"
                autoFocus
                className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-4 text-center text-xl tracking-[0.45em] text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

            </div>

            {/* VERIFY OTP */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Verifying OTP...'
                : 'Verify OTP'}
            </button>

            {/* RESEND */}

            <div className="flex items-center justify-between gap-3">

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-purple-300 transition-colors hover:text-purple-200"
              >
                Change Email or Phone
              </Link>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-sm font-medium text-purple-300 transition-colors hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending
                  ? 'Sending...'
                  : 'Resend OTP'}
              </button>

            </div>

          </form>
        )}

        {/* ====================================================
            PASSWORD SCREEN
            THIS IS SHOWN ONLY AFTER OTP VERIFICATION
        ==================================================== */}

        {step === 'password' && (

          <form
            onSubmit={handleResetPassword}
            className="mt-8 space-y-5"
          >


            {/* NEW PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                New Password
              </label>

              <input
                type="password"
                value={form.newPassword}
                onChange={(e) =>
                  handleChange(
                    'newPassword',
                    e.target.value
                  )
                }
                placeholder="Create new password"
                autoComplete="new-password"
                autoFocus
                className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              <p className="mt-2 text-xs text-slate-500">
                Password must be at least 8 characters.
              </p>

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Confirm New Password
              </label>

              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange(
                    'confirmPassword',
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

            </div>

            {/* RESET PASSWORD */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Updating Password...'
                : 'Set New Password'}
            </button>

            {/* BACK TO OTP */}

            <button
              type="button"
              onClick={() => {
                setStep('otp');

                setForm((prev) => ({
                  ...prev,
                  otp: '',
                  newPassword: '',
                  confirmPassword: '',
                }));
              }}
              className="w-full text-sm font-medium text-purple-300 transition-colors hover:text-purple-200"
            >
              ← Back to OTP
            </button>

          </form>
        )}

        {/* LOGIN */}

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
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import OTPVerification from './OTPVerification';
import { AuthContext } from '../../context/AuthContext';

const loginFeatureList = [
  'AI resume scoring and ATS readiness',
  'Career insights and job-fit recommendations',
  'Mock interview preparation and skill gaps',
  'Smart profile improvement suggestions'
];

const signupFeatureList = [
  'Upload and analyze your resume in minutes',
  'Get ATS-friendly resume improvement guidance',
  'Identify missing skills and job-relevant keywords',
  'Build a stronger profile for your target roles'
];

const termsText = [
  'You agree to provide accurate information when creating your account.',
  'You are responsible for keeping your account credentials secure.',
  'Resume analysis is provided as guidance and does not guarantee interviews or jobs.',
  'You agree not to upload content that you do not have permission to use.',
  'You agree that your submitted profile and resume data may be used to provide Resume Analyzer features.'
];

const signupInitialState = {
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false
};

const getApiUrl = () => {
  return (
    process.env.REACT_APP_API_URL ||
    'http://localhost:5001'
  ).replace(/\/$/, '');
};


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
// FORGOT PASSWORD
// ============================================================

export function ForgotPassword() {
  const [step, setStep] = useState('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const apiUrl = getApiUrl();

  const { toasts, showToast } = useToast();


  const requestResetOtp = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showToast('Please enter your email.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            email: cleanEmail
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(
          data.error ||
          'Unable to send OTP. Please try again.',
          'error'
        );
        return;
      }

      setEmail(cleanEmail);
      setOtp('');
      setStep('otp');

      showToast(
        data.message ||
        'OTP has been sent to your email.',
        'success'
      );

    } catch (error) {
      console.error(
        'Forgot password OTP error:',
        error
      );

      showToast(
        'Unable to send OTP. Please check your connection and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };


  const continueWithOtp = (e) => {
    e.preventDefault();

    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      showToast('Please enter the OTP.', 'error');
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      showToast('Please enter a valid 6-digit OTP.', 'error');
      return;
    }

    setOtp(cleanOtp);
    setStep('password');
  };


  const resendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setStep('email');
      return;
    }

    setResending(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            email: cleanEmail
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(
          data.error ||
          'Unable to resend OTP.',
          'error'
        );
        return;
      }

      setOtp('');

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


  const resetPassword = async (e) => {
    e.preventDefault();

    if (!otp || !/^\d{6}$/.test(otp.trim())) {
      showToast('Please enter a valid 6-digit OTP.', 'error');
      setStep('otp');
      return;
    }

    if (!newPassword) {
      showToast('Please enter a new password.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast(
        'Password must be at least 8 characters.',
        'error'
      );
      return;
    }

    if (!confirmPassword) {
      showToast(
        'Please confirm your new password.',
        'error'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
            newPassword,
            confirmPassword
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(
          data.error ||
          'Unable to reset password. Please try again.',
          'error'
        );

        if (
          data.error &&
          (
            data.error.toLowerCase().includes('otp') ||
            data.error.toLowerCase().includes('reset code')
          )
        ) {
          setStep('otp');
        }

        return;
      }

      showToast(
        data.message ||
        'Password reset successfully. You can now login.',
        'success'
      );

      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);

    } catch (error) {
      console.error(
        'Password reset error:',
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


  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">

      <ToastContainer toasts={toasts} />

      <div className="w-full max-w-xl rounded-[28px] border border-purple-500/20 bg-slate-950/90 p-6 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-sm md:p-8">

        <div className="mb-8">

          <div className="mb-4 inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-200">
            Resume Analyzer
          </div>

          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Reset Password
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {step === 'email' &&
              'Enter your registered email and we will send you an OTP.'}

            {step === 'otp' &&
              `Enter the 6-digit OTP sent to ${email}.`}

            {step === 'password' &&
              'Enter your new password below.'}
          </p>
        </div>


        <div className="mb-8 flex items-center gap-2">

          <div
            className={`h-2 flex-1 rounded-full ${
              step === 'email' ||
              step === 'otp' ||
              step === 'password'
                ? 'bg-purple-500'
                : 'bg-slate-800'
            }`}
          />

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


        {step === 'email' && (
          <form
            onSubmit={requestResetOtp}
            className="space-y-5"
          >

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Registered Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your registered email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

            </div>

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
        )}


        {step === 'otp' && (
          <form
            onSubmit={continueWithOtp}
            className="space-y-5"
          >

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Enter OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  )
                }
                placeholder="Enter 6-digit OTP"
                required
                className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-4 text-center text-xl tracking-[0.45em] text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>

            <div className="flex items-center justify-between gap-3">

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                }}
                className="text-sm font-medium text-purple-300 transition-colors hover:text-purple-200"
              >
                Change Email
              </button>

              <button
                type="button"
                disabled={resending}
                onClick={resendOtp}
                className="text-sm font-medium text-purple-300 transition-colors hover:text-purple-200 disabled:opacity-50"
              >
                {resending
                  ? 'Sending...'
                  : 'Resend OTP'}
              </button>

            </div>

          </form>
        )}


        {step === 'password' && (
          <form
            onSubmit={resetPassword}
            className="space-y-5"
          >

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Create new password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              <p className="mt-2 text-xs text-slate-500">
                Password must contain at least 8 characters.
              </p>

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Confirm New Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Updating Password...'
                : 'Set New Password'}
            </button>

            <button
              type="button"
              onClick={() => setStep('otp')}
              className="w-full text-sm font-medium text-purple-300 hover:text-purple-200"
            >
              ← Back to OTP
            </button>

          </form>
        )}


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
// ============================================================
// LOGIN / SIGNUP
// ============================================================

export default function LoginSignup({ variant = 'login' }) {

  const { login } = useContext(AuthContext);

  const location = useLocation();

  const googleButtonRef = useRef(null);
  const googleInitialized = useRef(false);

  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState(
    signupInitialState
  );

  const [otpState, setOtpState] = useState({
    visible: false,
    contact: '',
    mode: 'email'
  });

  const [showTerms, setShowTerms] = useState(false);

  const [loading, setLoading] = useState(false);

  const isSignup = variant === 'signup';

  const apiUrl = getApiUrl();

  const { toasts, showToast } = useToast();


  const handleFormChange = (
    setter,
    key,
    value
  ) => {
    setter((prev) => ({
      ...prev,
      [key]: value
    }));
  };


  const handleRegularLogin = async (e) => {
    e.preventDefault();

    const identifier =
      loginForm.identifier.trim();

    if (!identifier) {
      showToast(
        'Please enter your username, email or phone.',
        'error'
      );
      return;
    }

    if (!loginForm.password) {
      showToast('Please enter your password.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            identifier,
            password: loginForm.password
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(
          data.error ||
          'Unable to log in. Please try again.',
          'error'
        );
        return;
      }

      const targetPath =
        (
          location.state &&
          location.state.from &&
          location.state.from.pathname
        ) || '/home';

      login(
        data.token,
        targetPath
      );

    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      showToast(
        'Unable to log in. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };


  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {

      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        resolve();
        return;
      }

      const existingScript =
        document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );

      if (existingScript) {
        existingScript.addEventListener(
          'load',
          () => resolve(),
          { once: true }
        );

        existingScript.addEventListener(
          'error',
          () =>
            reject(
              new Error(
                'Google script failed to load'
              )
            ),
          { once: true }
        );

        return;
      }

      const script =
        document.createElement('script');

      script.src =
        'https://accounts.google.com/gsi/client';

      script.async = true;
      script.defer = true;

      script.onload = () => resolve();

      script.onerror = () =>
        reject(
          new Error(
            'Google script failed to load'
          )
        );

      document.body.appendChild(script);
    });
  };


  const handleGoogleCredentialResponse = async (res) => {
    try {
      if (!res || !res.credential) {
        showToast(
          'Google authentication failed. Please try again.',
          'error'
        );
        return;
      }

      const response = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          idToken: res.credential
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token) {
        showToast(
          data.error ||
          'Unable to sign in with Google. Please try again.',
          'error'
        );
        return;
      }

      const dest =
        (
          location.state &&
          location.state.from &&
          location.state.from.pathname
        ) || '/home';

      login(data.token, dest);

    } catch (error) {
      console.error('Google auth error:', error);
      showToast(
        'Unable to sign in with Google. Please try again.',
        'error'
      );
    }
  };


  useEffect(() => {
    let cancelled = false;

    const initGoogleButton = async () => {
      try {
        const cfgRes = await fetch(`${apiUrl}/auth/config`);

        let clientId = null;

        if (cfgRes.ok) {
          const json = await cfgRes.json();
          clientId = json?.config?.googleClientId || null;
        }

        if (!clientId) {
          clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || null;
        }

        if (!clientId) {
          console.warn('Google sign-in is not configured (missing GOOGLE_CLIENT_ID).');
          return;
        }

        await loadGoogleScript();

        if (cancelled) return;

        if (
          !window.google ||
          !window.google.accounts ||
          !window.google.accounts.id
        ) {
          console.warn('Google Sign-In could not be loaded.');
          return;
        }

        if (!googleInitialized.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          googleInitialized.current = true;
        }

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';

          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: isSignup ? 'signup_with' : 'continue_with',
              shape: 'rectangular'
            }
          );
        }
      } catch (error) {
        console.error('Error initializing Google sign-in:', error);
      }
    };

    initGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [isSignup]);


  const handleSignupSubmit = async (e) => {

    e.preventDefault();

    if (
      !signupForm.username ||
      !signupForm.email ||
      !signupForm.phone ||
      !signupForm.password ||
      !signupForm.confirmPassword
    ) {
      showToast(
        'Please complete all required fields.',
        'error'
      );
      return;
    }

    if (
      signupForm.password !==
      signupForm.confirmPassword
    ) {
      showToast(
        'Passwords do not match.',
        'error'
      );
      return;
    }

    if (
      signupForm.password.length < 8
    ) {
      showToast(
        'Password must be at least 8 characters.',
        'error'
      );
      return;
    }

    if (!signupForm.termsAccepted) {
      showToast(
        'Please accept the Terms & Conditions.',
        'error'
      );
      return;
    }

    setLoading(true);

    try {

      const response =
        await fetch(
          `${apiUrl}/auth/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              username:
                signupForm.username.trim(),

              email:
                signupForm.email.trim(),

              phone:
                signupForm.phone.trim(),

              password:
                signupForm.password,

              confirmPassword:
                signupForm.confirmPassword,

              termsAccepted:
                signupForm.termsAccepted
            })
          }
        );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(
          data.error ||
          'Unable to create account. Please try again.',
          'error'
        );
        return;
      }

      const destination =
        data.destination &&
        (
          data.destination.email ||
          data.destination.phone
        );

      showToast(
        data.message ||
        'Account created. Verification code sent.',
        'success'
      );

      setOtpState({
        visible: true,

        contact:
          destination ||
          signupForm.email ||
          signupForm.phone,

        mode:
          data.destination?.phone
            ? 'phone'
            : 'email'
      });

    } catch (error) {

      console.error(
        'Signup error:',
        error
      );

      showToast(
        'Unable to create account. Please try again.',
        'error'
      );

    } finally {
      setLoading(false);
    }
  };


  if (otpState.visible) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">

        <ToastContainer toasts={toasts} />

        <div className="w-full max-w-xl rounded-[28px] border border-purple-500/20 bg-slate-950/90 p-6 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-sm md:p-8">

          <OTPVerification
            contact={otpState.contact}
            mode={otpState.mode}
            onBack={() =>
              setOtpState({
                visible: false,
                contact: '',
                mode: 'email'
              })
            }
          />

        </div>

      </div>
    );
  }


  const termsModal = showTerms ? (

    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
      onClick={() =>
        setShowTerms(false)
      }
    >

      <div
        className="w-full max-w-2xl rounded-3xl border border-purple-500/25 bg-slate-950 p-6 shadow-[0_0_45px_rgba(168,85,247,0.3)] md:p-8"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="flex items-start justify-between gap-4">

          <div>

            <h3
              id="terms-title"
              className="text-2xl font-bold text-white"
            >
              Terms & Conditions
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Please review these conditions before creating your account.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowTerms(false)
            }
            className="rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close terms"
          >
            ✕
          </button>

        </div>

        <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-300">

          {termsText.map(
            (term, index) => (

              <li
                key={term}
                className="flex gap-3"
              >

                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />

                <span>
                  {index + 1}. {term}
                </span>

              </li>
            )
          )}

        </ul>

        <button
          type="button"
          onClick={() => {

            setSignupForm(
              (prev) => ({
                ...prev,
                termsAccepted: true
              })
            );

            setShowTerms(false);

          }}
          className="mt-7 w-full rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all hover:scale-[1.01]"
        >
          I Agree
        </button>

      </div>

    </div>

  ) : null;


  return (

    <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">

      <ToastContainer toasts={toasts} />

      <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-purple-500/20 bg-slate-950/80 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-sm">

        <div className="grid md:grid-cols-2">

          <div className="flex flex-col justify-between border-b border-white/10 bg-gradient-to-br from-purple-900/30 via-slate-950 to-slate-950 p-6 md:border-b-0 md:border-r md:p-10">

            <div>

              <div className="mb-7 inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-200">
                Resume Analyzer
              </div>

              <h1 className="max-w-md text-3xl font-bold tracking-tight text-white md:text-4xl">

                {isSignup
                  ? 'Create your career profile'
                  : 'Welcome Back'}

              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 md:text-base">

                {isSignup
                  ? 'Create your account to analyze resumes, improve your profile, and get career-ready insights.'
                  : 'Sign in to continue to your Resume Analyzer dashboard and career insights.'}

              </p>

            </div>

            <div className="mt-10 space-y-4">

              {(isSignup
                ? signupFeatureList
                : loginFeatureList
              ).map(
                (feature) => (

                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-2xl border border-purple-500/15 bg-slate-900/60 p-3"
                  >

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-sm font-bold text-white shadow-[0_0_12px_rgba(168,85,247,0.8)]">
                      ✓
                    </div>

                    <span className="text-sm text-slate-200">
                      {feature}
                    </span>

                  </div>
                )
              )}

            </div>

          </div>


          <div className="border-t border-white/5 p-6 md:border-t-0 md:p-10 md:pl-12">

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-white md:text-3xl">

                {isSignup
                  ? 'Create Account'
                  : 'Login'}

              </h2>

              <p className="mt-2 text-sm text-slate-400">

                {isSignup
                  ? 'Start building your career advantage.'
                  : 'Access your resume insights and job readiness.'}

              </p>

            </div>


            {isSignup ? (

              <form
                onSubmit={handleSignupSubmit}
                className="space-y-5"
              >

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Username
                  </label>

                  <input
                    value={signupForm.username}
                    onChange={(e) =>
                      handleFormChange(
                        setSignupForm,
                        'username',
                        e.target.value
                      )
                    }
                    placeholder="Choose a username"
                    autoComplete="username"
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Email
                  </label>

                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) =>
                      handleFormChange(
                        setSignupForm,
                        'email',
                        e.target.value
                      )
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={signupForm.phone}
                    onChange={(e) =>
                      handleFormChange(
                        setSignupForm,
                        'phone',
                        e.target.value
                      )
                    }
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>

                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) =>
                      handleFormChange(
                        setSignupForm,
                        'password',
                        e.target.value
                      )
                    }
                    placeholder="Create password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Minimum 8 characters.
                  </p>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(e) =>
                      handleFormChange(
                        setSignupForm,
                        'confirmPassword',
                        e.target.value
                      )
                    }
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                </div>

                <label className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-slate-900/40 p-3 text-sm text-slate-300">

                  <input
                    type="checkbox"
                    checked={
                      signupForm.termsAccepted
                    }
                    onChange={(e) =>
                      handleFormChange(
                        setSignupForm,
                        'termsAccepted',
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-purple-400 bg-slate-900 text-purple-500 focus:ring-purple-400"
                  />

                  <span>

                    I agree to the{' '}

                    <button
                      type="button"
                      onClick={() =>
                        setShowTerms(true)
                      }
                      className="font-semibold text-purple-300 underline underline-offset-2 transition-colors hover:text-purple-200"
                    >
                      Terms & Conditions
                    </button>

                  </span>

                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading
                    ? 'Creating account...'
                    : 'Create Account'}

                </button>

                <div className="flex items-center gap-3 py-1">

                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-xs text-slate-500">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-white/10" />

                </div>

                <div
                  ref={googleButtonRef}
                  className="flex w-full justify-center"
                />

              </form>

            ) : (

              <form
                onSubmit={handleRegularLogin}
                className="space-y-5"
              >

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Username / Email / Phone
                  </label>

                  <input
                    value={loginForm.identifier}
                    onChange={(e) =>
                      handleFormChange(
                        setLoginForm,
                        'identifier',
                        e.target.value
                      )
                    }
                    placeholder="Enter username, email or phone"
                    autoComplete="username"
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>

                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      handleFormChange(
                        setLoginForm,
                        'password',
                        e.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                </div>

                <div className="flex items-center justify-end">

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-purple-300 transition-colors hover:text-purple-200"
                  >
                    Forgot Password?
                  </Link>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading
                    ? 'Logging in...'
                    : 'Login'}

                </button>

                <div className="flex items-center gap-3 py-1">

                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-xs text-slate-500">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-white/10" />

                </div>

                <div
                  ref={googleButtonRef}
                  className="flex w-full justify-center"
                />

              </form>
            )}


            <div className="mt-7 text-center text-sm text-slate-300">

              {isSignup
                ? 'Already have an account?'
                : "Don't have an account?"}{' '}

              <Link
                to={
                  isSignup
                    ? '/login'
                    : '/signup'
                }
                className="font-semibold text-purple-300 transition-colors hover:text-purple-200"
              >

                {isSignup
                  ? 'Login'
                  : 'Create Account'}

              </Link>

            </div>

          </div>

        </div>

      </div>

      {termsModal}

    </div>
  );
}
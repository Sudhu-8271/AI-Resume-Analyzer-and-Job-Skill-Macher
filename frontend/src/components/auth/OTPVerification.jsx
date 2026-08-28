import React, { useEffect, useState } from 'react';

const getApiUrl = () => {
  return (
    process.env.REACT_APP_API_URL ||
    'http://localhost:5001'
  ).replace(/\/$/, '');
};

export default function OTPVerification({
  contact,
  mode = 'email',
  onBack
}) {
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [seconds, setSeconds] = useState(0);

  const apiUrl = getApiUrl();

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) =>
        prev > 0 ? prev - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);


  // ==========================================================
  // VERIFY SIGNUP OTP
  // ==========================================================

  const handleVerify = async (e) => {
    e.preventDefault();

    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      alert('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);

    try {
      const body =
        mode === 'phone'
          ? {
              phone: contact,
              otp: cleanOtp
            }
          : {
              email: contact,
              otp: cleanOtp
            };

      const response = await fetch(
        `${apiUrl}/auth/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(body)
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(
          data.error ||
          'Invalid or expired OTP.'
        );
        return;
      }

      alert(
        data.message ||
        'Account verified successfully. Please login.'
      );

      window.location.href = '/login';

    } catch (error) {
      console.error(
        'OTP verification error:',
        error
      );

      alert(
        'Unable to verify OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // RESEND
  // ==========================================================

  const handleResend = async () => {

    if (seconds > 0) {
      return;
    }

    setResending(true);

    try {

      const body =
        mode === 'phone'
          ? {
              phone: contact
            }
          : {
              email: contact
            };

      const response = await fetch(
        `${apiUrl}/auth/request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(body)
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(
          data.error ||
          'Unable to resend OTP.'
        );
        return;
      }

      setOtp('');
      setSeconds(30);

      alert(
        data.message ||
        'A new OTP has been sent.'
      );

    } catch (error) {
      console.error(
        'Resend OTP error:',
        error
      );

      alert(
        'Unable to resend OTP. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };


  return (
    <div className="w-full">

      <div className="mb-8">

        <div className="mb-4 inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-200">
          Verification
        </div>

        <h2 className="text-3xl font-bold text-white">
          Verify your account
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">

          Enter the 6-digit verification code sent to{' '}

          <span className="font-medium text-purple-300">
            {contact}
          </span>

        </p>

      </div>


      <form
        onSubmit={handleVerify}
        className="space-y-5"
      >

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-200">
            Verification Code
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
            placeholder="000000"
            className="w-full rounded-xl border border-purple-500/30 bg-slate-900/80 px-4 py-4 text-center text-2xl tracking-[0.5em] text-white placeholder:text-slate-600 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />

        </div>


        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {loading
            ? 'Verifying...'
            : 'Verify Account'}

        </button>


        <div className="flex items-center justify-between gap-3">

          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-purple-300 hover:text-purple-200"
          >
            ← Back
          </button>


          <button
            type="button"
            onClick={handleResend}
            disabled={
              resending ||
              seconds > 0
            }
            className="text-sm font-medium text-purple-300 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {resending
              ? 'Sending...'
              : seconds > 0
                ? `Resend in ${seconds}s`
                : 'Resend OTP'}

          </button>

        </div>

      </form>

    </div>
  );
}
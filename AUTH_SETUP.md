# Resume Analyzer Authentication System Setup Guide

## Overview
The Resume Analyzer now includes a complete, production-ready authentication system with support for:
- ✅ Username/Email/Phone login
- ✅ Password-based authentication with bcrypt hashing
- ✅ Signup with password confirmation and Terms & Conditions
- ✅ Email OTP verification
- ✅ Phone OTP verification (SMS)
- ✅ Google OAuth login
- ✅ Forgot password + password reset flow
- ✅ JWT-based sessions with refresh tokens
- ✅ Protected routes
- ✅ Secure logout

---

## Frontend Setup

### Pages
- **[/login](frontend/src/pages/LoginPage.jsx)** - Main login page
- **[/signup](frontend/src/pages/SignupPage.jsx)** - Account creation page
- **[/forgot-password](frontend/src/pages/ForgotPasswordPage.jsx)** - Password recovery initiation
- **[/reset-password](frontend/src/pages/ResetPasswordPage.jsx)** - New password entry with OTP verification

### Components
- **[LoginSignup.jsx](frontend/src/components/auth/LoginSignup.jsx)** - Unified auth component with real backend integration
- **[OTPVerification.jsx](frontend/src/components/auth/OTPVerification.jsx)** - OTP entry and verification with 2-minute countdown
- **[ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)** - Route guard for authenticated pages
- **[AuthContext.jsx](frontend/src/context/AuthContext.jsx)** - Global auth state management

### Key Features
- Resume Analyzer design system preserved (purple/neon theme)
- Responsive layout (mobile-optimized)
- Real-time form validation
- Loading states and error handling
- Automatic redirect to login if token expired
- OTP resend with countdown timer

---

## Backend Setup

### Models
- **[User.js](backend/models/User.js)** - MongoDB user schema with password hash, OTP storage, provider tracking

### Routes
All routes prefixed with `/auth`:
- `POST /signup` - Create new account
- `POST /login` - Username/email/phone + password login
- `POST /request-otp` - Request OTP for email or phone
- `POST /verify-otp` - Verify OTP and get session token
- `POST /forgot-password` - Initiate password reset (sends OTP)
- `POST /reset-password` - Complete password reset with OTP
- `POST /google` - Google OAuth callback handler
- `GET /config` - Get public config (Google Client ID)
- `POST /refresh` - Refresh expired JWT token
- `GET /me` - Get current logged-in user info
- `POST /logout` - Invalidate session

### Controllers
- **[authController.js](backend/controllers/authController.js)** - All auth business logic including:
  - Password hashing with bcrypt
  - OTP generation, hashing, storage, and validation
  - OTP expiry (10 minutes), cooldown (1 minute), max attempts (5)
  - JWT token generation and refresh
  - Google token verification
  - User signup/login duplicate detection
  - Password reset flow

---

## Environment Configuration

### Required Variables (Copy to `.env`)
```bash
# Server
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/ai_resume_analyzer

# JWT
JWT_SECRET=your-secure-random-secret-key-here
JWT_EXP=15m

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Email Delivery (Gmail SMTP example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=your-email@gmail.com

# SMS Delivery (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# AI API
GROQ_API_KEY=your-groq-api-key
```

### Frontend Variables (`.env`)
```bash
REACT_APP_GOOGLE_CLIENT_ID=same-as-backend-client-id
REACT_APP_API_URL=http://localhost:5001
```

---

## How to Get Credentials

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000` to authorized redirect URIs
6. Copy Client ID and Secret to `.env`

### SMTP (Gmail)
1. Enable 2FA on your Gmail account
2. Generate app-specific password: https://support.google.com/accounts/answer/185833
3. Use app password in `SMTP_PASS`
4. Note: Gmail may require you to "allow less secure apps" as an alternative

### Twilio SMS
1. Sign up at [Twilio.com](https://www.twilio.com/)
2. Get a phone number for SMS
3. Copy Account SID, Auth Token, and Phone Number to `.env`
4. Cost: ~$0.0075 per SMS in most countries

---

## Testing the Authentication System

### 1. Start the Backend
```bash
cd backend
npm install
node server.js
# Should output: "Backend running on port 5000" or "5001"
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

### 3. Test Signup Flow
- Navigate to http://localhost:3000/signup
- Fill in: username, email, phone, password, confirm password
- Check "I agree to the Terms & Conditions"
- Click "Create Account"
- You should receive an OTP via email or SMS (if credentials are configured)
- Enter OTP to complete signup

### 4. Test Login Flow
- Navigate to http://localhost:3000/login
- Enter email and password
- Click "Login"
- Should redirect to protected page or home

### 5. Test OTP Login
- On login page, click "Login with Email OTP" or "Login with Phone OTP"
- Enter your registered email or phone
- Verify OTP sent to your contact
- Enter OTP code in the verification field
- Should log you in

### 6. Test Google Login
- Click "Continue with Google"
- Sign in with your Google account
- Should create/login user and redirect

### 7. Test Forgot Password
- Click "Forgot Password?" on login page
- Enter your email or phone
- Receive OTP
- Enter new password (twice)
- Should reset password successfully

---

## API Response Examples

### Successful Login
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "provider": "password"
  }
}
```

### OTP Request Success
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "destination": "john@example.com"
}
```

### OTP Verify Success
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "verified": true
  }
}
```

---

## Security Features

✅ **Password Hashing**: bcrypt with salt rounds (12)
✅ **OTP Security**: Hashed storage, expiry (10 min), rate limiting (5 attempts)
✅ **JWT Tokens**: Secure signing with HS256, short expiry (15 min)
✅ **Refresh Tokens**: Enable long sessions without storing passwords
✅ **CORS**: Configured for localhost development
✅ **Environment Variables**: No secrets in code
✅ **Input Validation**: Email, phone, password format checks
✅ **Duplicate Detection**: Prevents username/email/phone reuse
✅ **Session Management**: Protected routes, logout invalidation

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### "MONGO_URI connection failed"
- Ensure MongoDB is running: `mongod`
- Check `.env` has correct MONGO_URI
- Default is `mongodb://127.0.0.1:27017/ai_resume_analyzer`

### "OTP not received"
- Check SMTP/Twilio credentials in `.env`
- Verify email/phone is correct in your account
- Check spam folder for email OTP
- For Gmail: Use app-specific password, not regular password

### "Google login not working"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`
- Ensure http://localhost:3000 is in Google OAuth redirect URIs
- Check browser console for CORS errors

### "Port 5000 already in use"
- Server automatically falls back to 5001
- Or kill the process: `lsof -i :5000` (Mac/Linux) or `netstat -ano | findstr :5000` (Windows)

---

## File Structure
```
ai-resume-analyzer/
├── backend/
│   ├── controllers/
│   │   └── authController.js        ← Auth logic
│   ├── models/
│   │   └── User.js                  ← User schema
│   ├── routes/
│   │   └── authRoutes.js            ← Auth endpoints
│   ├── .env.example                 ← Template
│   └── server.js                    ← Main server
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginSignup.jsx  ← Main auth UI
│   │   │   │   └── OTPVerification.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      ← State management
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   └── App.js                   ← Routes
│   └── .env.example
└── AUTH_SETUP.md                    ← This file
```

---

## Next Steps

1. **Configure `.env` with real credentials** (Google, SMTP, Twilio)
2. **Test each auth flow** following the testing guide above
3. **Deploy with production URLs** for Google OAuth redirect
4. **Enable HTTPS** for production (required for Google OAuth and secure sessions)
5. **Set secure JWT_SECRET** in production environment
6. **Monitor OTP delivery logs** to ensure email/SMS are working

---

## Support
If you encounter issues:
1. Check the console for error messages
2. Review `.env` for missing/incorrect values
3. Ensure MongoDB is running
4. Verify credentials are correct for Google/SMTP/Twilio
5. Check network tab in browser dev tools for API responses

---

**Status**: ✅ Production-Ready (pending credential configuration)
**Last Updated**: 2026-08-14

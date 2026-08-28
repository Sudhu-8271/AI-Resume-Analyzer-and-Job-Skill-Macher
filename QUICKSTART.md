# 🚀 Quick Start - Resume Analyzer Auth System

## Current Status
✅ **Complete & Running**
- Backend: Running on port 5001 ✓
- Frontend: Built successfully ✓
- MongoDB: Connected ✓
- All auth endpoints: Implemented ✓

---

## What Works Right Now (Without Extra Credentials)

1. **Signup Flow** (email/phone stored locally)
   - Create username + email + phone + password
   - Terms & Conditions acceptance
   - User saved to MongoDB

2. **Login Flow**
   - Email/phone/username + password login
   - JWT token generated
   - Session maintained

3. **Protected Routes**
   - Unauthenticated users redirected to /login
   - Token stored in localStorage

---

## What Needs Credentials to Test

| Feature | Needs | Where to Get |
|---------|-------|-------------|
| Email OTP | SMTP (Gmail) | [App Password](https://support.google.com/accounts/answer/185833) |
| Phone OTP | Twilio | [Twilio Console](https://www.twilio.com/console) |
| Google Login | Google OAuth | [Google Cloud Console](https://console.cloud.google.com/) |

---

## 5-Minute Setup to Test Locally

### 1. Create `.env` in backend/
```bash
cd backend
copy .env.example .env
```

Edit `.env` with:
```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/ai_resume_analyzer
JWT_SECRET=this-is-a-test-secret-key-for-development-only-12345678
JWT_EXP=15m
GROQ_API_KEY=test-key-or-skip
```

### 2. Create `.env` in frontend/
```bash
cd ..\frontend
copy .env.example .env
```

Edit `.env` with:
```
REACT_APP_API_URL=http://localhost:5001
REACT_APP_GOOGLE_CLIENT_ID=skip-for-now
```

### 3. Start Backend
```bash
cd ..\backend
npm install
node server.js
```
Output: `Backend running on port 5001` ✓

### 4. Start Frontend (new terminal)
```bash
cd frontend
npm install
npm start
```
Opens: http://localhost:3000

### 5. Test Signup (no extra credentials needed!)
- Go to http://localhost:3000/signup
- Fill form: username, email, phone, password
- Check Terms & Conditions
- Click "Create Account"
- **User saved to MongoDB!** ✓

### 6. Test Login
- Go to http://localhost:3000/login
- Enter email/phone + password from signup
- Click "Login"
- **You're in!** ✓

---

## Optional: Add Email OTP (10 minutes)

### Get Gmail App Password
1. Enable 2FA on your Gmail account
2. Go to https://support.google.com/accounts/answer/185833
3. Generate "App password" for "Mail" and "Windows"
4. Copy the generated password (16 chars, no spaces)

### Update backend/.env
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-from-above
SMTP_FROM=your-email@gmail.com
```

### Test Email OTP
1. Restart backend: `node server.js`
2. Go to http://localhost:3000/login
3. Click "Email OTP"
4. Enter your email
5. Check inbox for 6-digit OTP code
6. Enter OTP to login!

---

## Optional: Add Google Login (15 minutes)

### Get Google OAuth Credentials
1. Go to https://console.cloud.google.com/
2. Create new project (e.g., "Resume Analyzer")
3. Search "Google+ API" → Enable
4. Go to "Credentials" → Create OAuth 2.0 credential
5. Choose "Web application"
6. Add redirect URI: `http://localhost:3000`
7. Copy Client ID and Secret

### Update backend/.env
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret-here
```

### Update frontend/.env
```
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Test Google Login
1. Restart both frontend and backend
2. Go to http://localhost:3000/login
3. Click "Continue with Google"
4. Sign in with your Google account
5. **Auto-creates account & logs in!**

---

## Common Issues & Fixes

### Backend won't start
```bash
# Issue: "Port 5000 already in use"
# Fix: It auto-uses 5001, or kill process on 5000

# Issue: "Cannot find module 'express'"
cd backend && npm install
```

### Frontend shows blank/white screen
```bash
# Issue: Backend not running
# Fix: Start backend first on port 5001

# Issue: Wrong API URL
# Check frontend/.env has: REACT_APP_API_URL=http://localhost:5001
```

### OTP not received
```bash
# Issue: Gmail SMTP not working
# Fix: Use app-specific password (not regular password)
#      Enable "Less secure apps" if using regular password
#      Check spam folder

# Issue: Twilio not working
# Fix: Verify Account SID, Auth Token, and FROM number
```

### Google login shows error
```bash
# Issue: "Redirect URI mismatch"
# Fix: Add http://localhost:3000 to Google OAuth redirect URIs

# Issue: Client ID not found
# Fix: Ensure GOOGLE_CLIENT_ID in backend/.env
```

---

## File Locations

```
backend/
├── .env                  ← Create this & add credentials
├── .env.example          ← Template
├── server.js             ← Run: node server.js
├── controllers/
│   └── authController.js ← Auth logic
├── routes/
│   └── authRoutes.js     ← Auth endpoints
└── models/
    └── User.js           ← User schema

frontend/
├── .env                  ← Create this
├── .env.example          ← Template
├── src/
│   ├── App.js            ← Routes
│   ├── components/
│   │   └── auth/
│   │       ├── LoginSignup.jsx
│   │       └── OTPVerification.jsx
│   └── context/
│       └── AuthContext.jsx
└── package.json          ← Run: npm start
```

---

## What's Included

### Auth Methods ✅
- [x] Email/Phone/Username + Password
- [x] Email OTP Login
- [x] Phone OTP Login
- [x] Google OAuth
- [x] Signup with confirmation
- [x] Forgot Password + Reset
- [x] Protected Routes

### Security ✅
- [x] bcrypt password hashing
- [x] OTP rate limiting
- [x] JWT sessions
- [x] Refresh tokens
- [x] CORS enabled
- [x] Input validation

### UX ✅
- [x] Resume Analyzer theme (purple/neon)
- [x] Mobile responsive
- [x] Error messages
- [x] Loading states
- [x] OTP countdown timer
- [x] Resend OTP button

---

## Next Steps

1. **Copy `.env.example` → `.env`** in both backend and frontend
2. **Add JWT_SECRET** (any 32+ char string for dev)
3. **Test basic login/signup** (works without extra credentials)
4. **Optional: Add Email OTP** using Gmail (10 min)
5. **Optional: Add Google Login** using Google Cloud (15 min)
6. **For production**: Use real HTTPS URLs and secrets

---

## Support Files

📖 **Full Setup Guide**: [AUTH_SETUP.md](AUTH_SETUP.md)
📝 **Conversation Summary**: See previous context for detailed implementation notes

---

**Ready to go!** 🎉 Just add `.env` files and start the servers.

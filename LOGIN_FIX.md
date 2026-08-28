# Login Error Fix - Complete Guide

## 🔴 The Problem
The frontend was trying to connect to the backend using **relative paths** (`/auth/login`) but the backend runs on a **different port** (5001). The frontend couldn't reach the backend APIs.

## ✅ The Solution
Updated all API calls in the frontend to use the **full backend URL**:
- Before: `fetch('/auth/login')` → tries to connect to localhost:3000
- After: `fetch('http://localhost:5001/auth/login')` → connects to actual backend

## 📝 Files Fixed
1. `frontend/src/components/auth/LoginSignup.jsx` - Login, signup, OTP requests
2. `frontend/src/components/auth/OTPVerification.jsx` - OTP verification
3. `frontend/src/pages/ResetPasswordPage.jsx` - Password reset
4. `frontend/.env` - Added API URL configuration
5. `backend/.env` - Added missing JWT_SECRET

---

## 🚀 How to Test Login Now

### Step 1: Start the Backend
```bash
cd backend
node server.js
```
You should see:
```
β—‡ injected env (16) from .env
🚀 Backend running on fallback port 5001
MongoDB Connected
```

### Step 2: Start the Frontend (New Terminal)
```bash
cd frontend
npm start
```
Opens http://localhost:3000

### Step 3: Sign Up First
Go to http://localhost:3000/signup

Fill in:
- **Username**: testuser
- **Email**: test@example.com
- **Phone**: +1234567890
- **Password**: TestPass123
- **Confirm Password**: TestPass123
- ✅ Check "I agree to the Terms & Conditions"

Click **"Create Account"**

**Important**: You'll see an OTP screen, but since we don't have email/SMS configured, you can:
- Close the browser tab (account is saved)
- Or just refresh the page

### Step 4: Log In
Go to http://localhost:3000/login

Enter:
- **Email/Username/Phone**: test@example.com (or your email from step 3)
- **Password**: TestPass123

Click **"Login"**

**Expected Result**: ✅ Should log in successfully and redirect to home page

---

## 🔍 How to Debug if Still Getting Error

### Check 1: Backend is Running
```bash
# In backend terminal, check for this output:
Backend running on fallback port 5001
MongoDB Connected
```

### Check 2: Frontend has .env file
```bash
# Check frontend/.env exists
cat frontend/.env
# Should show:
# REACT_APP_API_URL=http://localhost:5001
# REACT_APP_GOOGLE_CLIENT_ID=...
```

### Check 3: Backend has JWT_SECRET
```bash
# Check backend/.env has JWT_SECRET
cat backend/.env | grep JWT_SECRET
# Should show:
# JWT_SECRET=your-super-secret-jwt-key-...
```

### Check 4: Browser Console for Network Errors
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for the `/auth/login` request
5. Check:
   - Is it going to `http://localhost:5001`?
   - What's the response status?
   - What error message is returned?

### Check 5: Backend Console for Errors
Look at the backend terminal where `node server.js` is running. Any errors should be logged there.

---

## 🛠️ Common Issues & Fixes

### Issue: Still getting "Unable to log in. Please try again."

**Possible cause 1**: Frontend not rebuilt
```bash
# Rebuild frontend
cd frontend
npm run build
npm start
```

**Possible cause 2**: Backend not restarted after .env change
```bash
# Stop backend (Ctrl+C) and restart
cd backend
node server.js
```

**Possible cause 3**: Wrong email/password
- Make sure you create an account first (signup)
- Use exact same email and password when logging in

**Possible cause 4**: MongoDB not connected
```bash
# Check MongoDB is running
mongod
# Or check if connection string is correct in backend/.env
# MONGO_URI=mongodb://127.0.0.1:27017/ai_resume_analyzer
```

### Issue: Network error or "Cannot reach backend"

**Fix 1**: Verify backend URL in frontend
```bash
# frontend/.env should have:
REACT_APP_API_URL=http://localhost:5001
```

**Fix 2**: Check if backend is actually running on 5001
```bash
# Backend tries port 5000 first, falls back to 5001 if busy
# Check server output for:
# "Backend running on fallback port 5001"
```

**Fix 3**: CORS issue
- Frontend on http://localhost:3000
- Backend on http://localhost:5001
- Both are localhost, so CORS should be fine

### Issue: "Invalid credentials" error

This means the login request reached the backend, but the user doesn't exist or password is wrong.

**Fix**: Sign up first, make sure you use the exact email/phone and password when logging in

---

## 📊 Architecture

```
Frontend (localhost:3000)
    ↓ (http://localhost:5001/auth/login)
Backend (localhost:5001)
    ↓ (generates JWT)
Frontend receives token → stores in localStorage → redirected to /home
```

---

## ✨ What Should Happen

1. **Signup**:
   - User creates account with email/phone/password
   - Account saved to MongoDB
   - OTP screen shown (no email/SMS needed for local testing)

2. **Login**:
   - User enters email + password
   - Backend verifies password (bcrypt)
   - Backend generates JWT token
   - Frontend stores token in localStorage
   - Frontend redirects to home page
   - User is logged in!

---

## 📚 Related Files
- `backend/.env` - Backend configuration with JWT_SECRET
- `frontend/.env` - Frontend configuration with API_URL
- `backend/controllers/authController.js` - Login logic
- `frontend/src/components/auth/LoginSignup.jsx` - Login UI
- `frontend/src/context/AuthContext.jsx` - Token storage

---

## ✅ Verification Checklist

- [ ] Backend is running on port 5001
- [ ] Frontend `.env` has `REACT_APP_API_URL=http://localhost:5001`
- [ ] Backend `.env` has `JWT_SECRET` set
- [ ] You created an account (signup) first
- [ ] You're using correct email/phone and password for login
- [ ] Frontend is rebuilt after code changes

If all checked, login should work! 🎉

---

**Still having issues?**
1. Check browser console (F12) for error messages
2. Check backend console for server-side errors
3. Verify all files were saved correctly
4. Restart both frontend and backend

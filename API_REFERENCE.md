# Auth API Reference

## Base URL
```
http://localhost:5001/auth
```

---

## Endpoints

### 1. Signup
**POST** `/signup`

Create a new user account with email, phone, password.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created. Verification code sent.",
  "destination": {
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Error Response (400/409):**
```json
{
  "error": "Email already registered" / "Username already taken" / "Phone already in use"
}
```

---

### 2. Login
**POST** `/login`

Login with username, email, or phone + password.

**Request:**
```json
{
  "identifier": "johndoe",  // username OR email OR phone
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "provider": "password",
    "verified": true
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials" / "User not found"
}
```

---

### 3. Request OTP
**POST** `/request-otp`

Send OTP to email or phone for passwordless login or verification.

**Request (Email):**
```json
{
  "email": "john@example.com"
}
```

**Request (Phone):**
```json
{
  "phone": "+1234567890"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to john@example.com",
  "destination": "john@example.com",
  "expiresIn": "10 minutes"
}
```

**Error Response (400/429):**
```json
{
  "error": "User not found" / "Too many OTP requests. Wait before requesting again."
}
```

---

### 4. Verify OTP
**POST** `/verify-otp`

Verify OTP code for login or registration.

**Request:**
```json
{
  "email": "john@example.com",  // OR "phone"
  "otp": "123456"
}
```

**Success Response (200):**
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

**Error Response (400):**
```json
{
  "error": "Invalid OTP" / "OTP expired" / "Max OTP attempts exceeded. Request new OTP."
}
```

---

### 5. Google Login
**POST** `/google`

Authenticate with Google OAuth token.

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@gmail.com",
    "provider": "google",
    "verified": true
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid token" / "Google verification failed"
}
```

---

### 6. Forgot Password
**POST** `/forgot-password`

Send OTP for password reset.

**Request:**
```json
{
  "email": "john@example.com"  // OR "phone"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to john@example.com",
  "destination": "john@example.com"
}
```

**Error Response (400):**
```json
{
  "error": "User not found"
}
```

---

### 7. Reset Password
**POST** `/reset-password`

Complete password reset with OTP verification.

**Request:**
```json
{
  "email": "john@example.com",  // OR "phone"
  "otp": "123456",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid OTP" / "Passwords do not match" / "OTP expired"
}
```

---

### 8. Get Config
**GET** `/config`

Get public configuration (Google Client ID, etc.).

**Response (200):**
```json
{
  "config": {
    "googleClientId": "123456789.apps.googleusercontent.com"
  }
}
```

---

### 9. Refresh Token
**POST** `/refresh`

Get a new JWT token using refresh token.

**Headers:**
```
Authorization: Bearer <old-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid or expired token"
}
```

---

### 10. Get Current User
**GET** `/me`

Get the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "provider": "password",
    "verified": true,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Not authenticated" / "Token expired"
}
```

---

### 11. Logout
**POST** `/logout`

Invalidate current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Authentication

### Using JWT Token

After login/signup/OTP verification, you receive a `token`. Use it in subsequent requests:

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example with curl:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/auth/me
```

**Example with JavaScript:**
```javascript
const response = await fetch('/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## OTP Behavior

### Timing
- **Validity**: 10 minutes from generation
- **Rate Limit**: 5 attempts per OTP
- **Cooldown**: 1 minute between OTP requests
- **Resend**: Available after 2 minutes

### Workflow
1. Request OTP → Sent via email/SMS
2. User has 10 minutes to verify
3. User has 5 attempts before OTP expires
4. After 1 minute, can request new OTP
5. Each new OTP invalidates the previous one

---

## Security Headers

All responses include:
```
Access-Control-Allow-Origin: *
Content-Type: application/json
```

For production, update CORS origins in backend/server.js

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (signup) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (invalid token/credentials) |
| 409 | Conflict (user exists) |
| 429 | Too many requests (rate limited) |
| 500 | Server error |

---

## Testing with Postman/Thunder Client

1. **Signup**
   - POST http://localhost:5001/auth/signup
   - Body (JSON): username, email, phone, password, confirmPassword, termsAccepted

2. **Login**
   - POST http://localhost:5001/auth/login
   - Body: identifier, password
   - Copy token from response

3. **Get User**
   - GET http://localhost:5001/auth/me
   - Header: Authorization: Bearer {token}

4. **Request OTP**
   - POST http://localhost:5001/auth/request-otp
   - Body: email or phone

5. **Verify OTP**
   - POST http://localhost:5001/auth/verify-otp
   - Body: email/phone, otp

---

## Example Workflow: Complete Registration

```
1. POST /signup
   ↓
2. User receives OTP email/SMS
   ↓
3. POST /verify-otp
   ↓
4. Receive JWT token → Store in localStorage
   ↓
5. GET /me (with Bearer token) → Get user profile
   ↓
6. Navigate to protected pages
```

---

## Example Workflow: Passwordless Login

```
1. POST /request-otp
   ↓
2. User receives OTP email/SMS
   ↓
3. POST /verify-otp
   ↓
4. Receive JWT token → Auto-login
   ↓
5. Redirect to dashboard
```

---

## Example Workflow: Google Login

```
1. User clicks "Continue with Google"
   ↓
2. Google sign-in popup
   ↓
3. POST /google (with idToken)
   ↓
4. Auto-creates account OR logs in existing
   ↓
5. Receive JWT token → Auto-login
```

---

## Example Workflow: Password Reset

```
1. POST /forgot-password
   ↓
2. User receives OTP email/SMS
   ↓
3. POST /reset-password (with new password + OTP)
   ↓
4. Password updated in database
   ↓
5. Can login with new password
```

---

## Rate Limits

- OTP Requests: Max 5 per minute per email/phone
- OTP Attempts: Max 5 per OTP code
- Login Attempts: No limit (implement on frontend if needed)

---

## Database Schema

### User Document
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  phone: String (unique),
  passwordHash: String (bcrypt),
  otp: String (hashed),
  otpExpiry: Date,
  otpAttempts: Number,
  lastOtpRequestTime: Date,
  provider: String (password|google),
  verified: Boolean,
  refreshTokens: [String],
  createdAt: Date,
  updatedAt: Date
}
```

---

**Last Updated**: 2026-08-14
**Status**: Production Ready ✅

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

let googleClient = null;

try {
  const { OAuth2Client } = require('google-auth-library');

  const googleClientId = process.env.GOOGLE_CLIENT_ID || null;

  if (googleClientId) {
    googleClient = new OAuth2Client(googleClientId);
  }
} catch (error) {
  console.warn(
    'google-auth-library is not available:',
    error.message
  );
  googleClient = null;
}

// ============================================================
// CONFIG
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;

const JWT_EXP = process.env.JWT_EXP || '15m';

const REFRESH_EXP_DAYS = 30;

const OTP_TTL_MS = 5 * 60 * 1000;

const OTP_COOLDOWN_MS = 30 * 1000;

const MAX_OTP_ATTEMPTS = 5;

if (!JWT_SECRET) {
  console.warn(
    'WARNING: JWT_SECRET is not configured in .env'
  );
}

// ============================================================
// NORMALIZERS
// ============================================================

const normalizeEmail = (value = '') =>
  String(value).trim().toLowerCase();

const normalizePhone = (value = '') =>
  String(value).replace(/[^\d+]/g, '').trim();

const normalizeUsername = (value = '') =>
  String(value).trim();

// ============================================================
// VALIDATORS
// ============================================================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\+?[0-9\s()-]{7,20}$/.test(phone);
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,30}$/.test(username);
}

// ============================================================
// OTP
// ============================================================

function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function hashValue(value) {
  return bcrypt.hash(String(value), 12);
}

async function compareHash(value, hash) {
  if (!value || !hash) {
    return false;
  }

  return bcrypt.compare(
    String(value),
    String(hash)
  );
}

// ============================================================
// JWT
// ============================================================

function issueToken(user) {
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not configured on the server.'
    );
  }

  const payload = {
    userId: user._id.toString(),
    username: user.username || null,
    email: user.email || null,
    phone: user.phone || null,
    provider: user.provider || 'local'
  };

  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXP
    }
  );
}

// ============================================================
// COOKIE OPTIONS
// ============================================================

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === 'production',
    sameSite:
      process.env.NODE_ENV === 'production'
        ? 'none'
        : 'lax',
    maxAge:
      REFRESH_EXP_DAYS *
      24 *
      60 *
      60 *
      1000,
    path: '/'
  };
}

// ============================================================
// REFRESH TOKEN
// ============================================================

async function createRefreshTokenForUser(user) {
  const refreshToken =
    crypto.randomBytes(48).toString('hex');

  user.refreshTokens =
    user.refreshTokens || [];

  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date()
  });

  // Keep only latest 10 refresh tokens
  if (user.refreshTokens.length > 10) {
    user.refreshTokens =
      user.refreshTokens.slice(-10);
  }

  await user.save();

  return refreshToken;
}

// ============================================================
// SEND OTP EMAIL
// ============================================================

async function sendOtpEmail(email, otp) {
  if (!email) {
    return false;
  }

  const smtpHost =
    process.env.SMTP_HOST;

  const smtpUser =
    process.env.SMTP_USER;

  const smtpPass =
    process.env.SMTP_PASS;

  if (
    !smtpHost ||
    !smtpUser ||
    !smtpPass
  ) {
    console.warn(
      '[DEV MODE] SMTP is not configured.'
    );

    console.log(
      `[DEV] OTP for ${email}: ${otp}`
    );

    return false;
  }

  const transporter =
    nodemailer.createTransport({
      host: smtpHost,
      port: Number(
        process.env.SMTP_PORT || 587
      ),
      secure:
        process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

  await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      smtpUser,

    to: email,

    subject:
      'Your Resume Analyzer verification code',

    text:
      `Your verification code is ${otp}. ` +
      `It expires in 5 minutes.`
  });

  return true;
}

// ============================================================
// SEND OTP SMS
// ============================================================

async function sendOtpSms(phone, otp) {
  const sid =
    process.env.TWILIO_ACCOUNT_SID;

  const token =
    process.env.TWILIO_AUTH_TOKEN;

  const fromNumber =
    process.env.TWILIO_FROM_NUMBER;

  if (
    !sid ||
    !token ||
    !fromNumber
  ) {
    console.warn(
      '[DEV MODE] Twilio SMS is not configured.'
    );

    console.log(
      `[DEV] OTP for ${phone}: ${otp}`
    );

    return false;
  }

  const auth =
    Buffer
      .from(`${sid}:${token}`)
      .toString('base64');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',

      headers: {
        Authorization:
          'Basic ' + auth,

        'Content-Type':
          'application/x-www-form-urlencoded'
      },

      body:
        new URLSearchParams({
          To: phone,
          From: fromNumber,
          Body:
            `Your Resume Analyzer verification code is ${otp}. ` +
            `It expires in 5 minutes.`
        }).toString()
    }
  );

  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      body ||
      'Unable to send SMS OTP.'
    );
  }

  return true;
}

// ============================================================
// SEND OTP
// ============================================================

async function sendOtpToDestination(
  user,
  email,
  phone,
  otp
) {
  if (email) {
    await sendOtpEmail(
      email,
      otp
    );

    return { email };
  }

  if (phone) {
    await sendOtpSms(
      phone,
      otp
    );

    return { phone };
  }

  throw new Error(
    'No valid OTP destination available.'
  );
}

// ============================================================
// PREPARE OTP
// ============================================================

async function prepareOtpForUser(
  user,
  destination
) {
  const now = Date.now();

  if (
    user.lastOtpSentAt &&
    now -
      new Date(
        user.lastOtpSentAt
      ).getTime() <
      OTP_COOLDOWN_MS
  ) {
    const remaining =
      Math.ceil(
        (
          OTP_COOLDOWN_MS -
          (
            now -
            new Date(
              user.lastOtpSentAt
            ).getTime()
          )
        ) / 1000
      );

    throw new Error(
      `Please wait ${remaining} seconds before requesting a new OTP.`
    );
  }

  const otp =
    generateSecureOTP();

  user.otp = {
    code:
      await hashValue(otp),

    expiresAt:
      new Date(
        now + OTP_TTL_MS
      ),

    attempts: 0,

    purpose: 'auth',

    createdAt:
      new Date(now)
  };

  user.lastOtpSentAt =
    new Date(now);

  await user.save();

  try {
    await sendOtpToDestination(
      user,
      destination.email,
      destination.phone,
      otp
    );
  } catch (error) {
    console.error(
      'OTP delivery error:',
      error.message
    );

    // Keep development fallback
    console.log(
      `[DEV] OTP for ${
        destination.email ||
        destination.phone
      }: ${otp}`
    );
  }

  return true;
}

// ============================================================
// FIND USER BY IDENTIFIER
// ============================================================

function getUserByIdentifier(
  identifier
) {
  const value =
    normalizeUsername(identifier);

  if (!value) {
    return null;
  }

  if (
    isValidEmail(value)
  ) {
    return {
      email:
        normalizeEmail(value)
    };
  }

  if (
    /^\+?[0-9\s()-]{7,20}$/.test(
      value
    )
  ) {
    return {
      phone:
        normalizePhone(value)
    };
  }

  return {
    username: value
  };
}

// ============================================================
// SIGNUP
// ============================================================

exports.signup = async (
  req,
  res
) => {
  try {
    const {
      username,
      email,
      phone,
      password,
      confirmPassword,
      termsAccepted
    } = req.body || {};

    if (
      !username ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        error:
          'Please complete all required fields.'
      });
    }

    if (
      password !== confirmPassword
    ) {
      return res.status(400).json({
        error:
          'Passwords do not match.'
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        error:
          'Please accept the Terms & Conditions.'
      });
    }

    const trimmedUsername =
      normalizeUsername(username);

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedPhone =
      normalizePhone(phone);

    if (
      !isValidUsername(
        trimmedUsername
      )
    ) {
      return res.status(400).json({
        error:
          'Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens.'
      });
    }

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        error:
          'Please enter a valid email address.'
      });
    }

    if (
      !isValidPhone(
        normalizedPhone
      )
    ) {
      return res.status(400).json({
        error:
          'Please enter a valid phone number.'
      });
    }

    if (
      password.length < 8
    ) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters long.'
      });
    }

    const existingUser =
      await User.findOne({
        $or: [
          {
            username:
              trimmedUsername
          },
          {
            email:
              normalizedEmail
          },
          {
            phone:
              normalizedPhone
          }
        ]
      });

    if (existingUser) {
      if (
        existingUser.username ===
        trimmedUsername
      ) {
        return res.status(409).json({
          error:
            'This username is already taken.'
        });
      }

      if (
        existingUser.email ===
        normalizedEmail
      ) {
        return res.status(409).json({
          error:
            'An account with this email already exists.'
        });
      }

      if (
        existingUser.phone ===
        normalizedPhone
      ) {
        return res.status(409).json({
          error:
            'An account with this phone number already exists.'
        });
      }

      return res.status(409).json({
        error:
          'An account with these details already exists.'
      });
    }

    const newUser =
      new User({
        username:
          trimmedUsername,

        email:
          normalizedEmail,

        phone:
          normalizedPhone,

        name:
          trimmedUsername,

        passwordHash:
          await hashValue(
            password
          ),

        provider:
          'local',

        isVerified:
          false,

        emailVerified:
          false,

        phoneVerified:
          false,

        termsAccepted:
          true
      });

    await newUser.save();

    await prepareOtpForUser(
      newUser,
      {
        email:
          normalizedEmail,

        phone:
          normalizedPhone
      }
    );

    return res.status(201).json({
      success: true,

      message:
        'Account created. Verification code sent successfully.',

      requiresVerification:
        true,

      destination: {
        email:
          normalizedEmail
      }
    });
  } catch (error) {
    console.error(
      'SIGNUP ERROR:',
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        error:
          'Username, email, or phone number is already registered.'
      });
    }

    return res.status(500).json({
      error:
        error.message ||
        'Unable to create account. Please try again.'
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

exports.login = async (
  req,
  res
) => {
  try {
    const {
      identifier,
      password
    } = req.body || {};

    if (
      !identifier ||
      !password
    ) {
      return res.status(400).json({
        error:
          'Username, email, or phone and password are required.'
      });
    }

    const lookup =
      getUserByIdentifier(
        identifier
      );

    if (!lookup) {
      return res.status(400).json({
        error:
          'Invalid login details.'
      });
    }

    const conditions = [];

    if (lookup.email) {
      conditions.push({
        email:
          lookup.email
      });
    }

    if (lookup.phone) {
      conditions.push({
        phone:
          lookup.phone
      });
    }

    if (lookup.username) {
      conditions.push({
        username:
          lookup.username
      });
    }

    const user =
      await User.findOne({
        $or: conditions
      });

    if (!user) {
      return res.status(401).json({
        error:
          'Invalid username, email, or password.'
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        error:
          'This account does not have a password. Please use Google or OTP login.'
      });
    }

    const valid =
      await compareHash(
        password,
        user.passwordHash
      );

    if (!valid) {
      return res.status(401).json({
        error:
          'Invalid username, email, or password.'
      });
    }

    const token =
      issueToken(user);

    const refreshToken =
      await createRefreshTokenForUser(
        user
      );

    user.lastLoginAt =
      new Date();

    await user.save();

    res.cookie(
      'refreshToken',
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.json({
      success: true,

      token,

      user: {
        id:
          user._id,

        username:
          user.username,

        email:
          user.email,

        phone:
          user.phone,

        name:
          user.name,

        provider:
          user.provider
      }
    });
  } catch (error) {
    console.error(
      'LOGIN ERROR:',
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        'Unable to log in. Please try again.'
    });
  }
};

// ============================================================
// REQUEST OTP
// ============================================================

exports.requestOtp = async (
  req,
  res
) => {
  try {
    const {
      email,
      phone
    } = req.body || {};

    const targetEmail =
      email
        ? normalizeEmail(email)
        : null;

    const targetPhone =
      phone
        ? normalizePhone(phone)
        : null;

    if (
      !targetEmail &&
      !targetPhone
    ) {
      return res.status(400).json({
        error:
          'Email or phone number is required.'
      });
    }

    if (
      targetEmail &&
      !isValidEmail(targetEmail)
    ) {
      return res.status(400).json({
        error:
          'Please enter a valid email address.'
      });
    }

    if (
      targetPhone &&
      !isValidPhone(targetPhone)
    ) {
      return res.status(400).json({
        error:
          'Please enter a valid phone number.'
      });
    }

    const query =
      targetEmail
        ? {
            email:
              targetEmail
          }
        : {
            phone:
              targetPhone
          };

    const user =
      await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        error:
          'No account was found for this email or phone number.'
      });
    }

    await prepareOtpForUser(
      user,
      {
        email:
          targetEmail,

        phone:
          targetPhone
      }
    );

    return res.json({
      success: true,

      message:
        'Verification code sent successfully.',

      destination:
        targetEmail
          ? {
              email:
                targetEmail
            }
          : {
              phone:
                targetPhone
            }
    });
  } catch (error) {
    console.error(
      'REQUEST OTP ERROR:',
      error
    );

    return res.status(400).json({
      error:
        error.message ||
        'Unable to send OTP. Please try again.'
    });
  }
};

// ============================================================
// VERIFY OTP
// ============================================================

exports.verifyOtp = async (
  req,
  res
) => {
  try {
    const {
      email,
      phone,
      otp
    } = req.body || {};

    const targetEmail =
      email
        ? normalizeEmail(email)
        : null;

    const targetPhone =
      phone
        ? normalizePhone(phone)
        : null;

    if (
      !otp ||
      (
        !targetEmail &&
        !targetPhone
      )
    ) {
      return res.status(400).json({
        error:
          'Missing verification details.'
      });
    }

    const query =
      targetEmail
        ? {
            email:
              targetEmail
          }
        : {
            phone:
              targetPhone
          };

    const user =
      await User.findOne(query);

    if (
      !user ||
      !user.otp
    ) {
      return res.status(400).json({
        error:
          'OTP request not found. Please request a new code.'
      });
    }

    if (
      !user.otp.expiresAt ||
      new Date() >
        new Date(
          user.otp.expiresAt
        )
    ) {
      user.otp = undefined;

      await user.save();

      return res.status(400).json({
        error:
          'Invalid or expired OTP. Please request a new code.'
      });
    }

    if (
      (user.otp.attempts || 0) >=
      MAX_OTP_ATTEMPTS
    ) {
      user.otp = undefined;

      await user.save();

      return res.status(400).json({
        error:
          'Too many failed verification attempts. Please request a new code.'
      });
    }

    const isValid =
      await compareHash(
        String(otp).trim(),
        user.otp.code
      );

    if (!isValid) {
      user.otp.attempts =
        (user.otp.attempts || 0) +
        1;

      await user.save();

      return res.status(400).json({
        error:
          'Invalid or expired OTP. Please request a new code.'
      });
    }

    user.isVerified = true;

    if (targetEmail) {
      user.emailVerified = true;
    }

    if (targetPhone) {
      user.phoneVerified = true;
    }

    user.otp = undefined;

    user.lastLoginAt =
      new Date();

    const token =
      issueToken(user);

    const refreshToken =
      await createRefreshTokenForUser(
        user
      );

    // createRefreshTokenForUser already saves.
    // Save again for the verification fields.
    await user.save();

    res.cookie(
      'refreshToken',
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.json({
      success: true,

      token,

      user: {
        id:
          user._id,

        username:
          user.username,

        email:
          user.email,

        phone:
          user.phone,

        name:
          user.name,

        provider:
          user.provider
      }
    });
  } catch (error) {
    console.error(
      'VERIFY OTP ERROR:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to verify OTP. Please try again.'
    });
  }
};

// ============================================================
// VERIFY RESET OTP
// ============================================================

exports.verifyResetOtp = async (
  req,
  res
) => {
  try {
    const {
      email,
      phone,
      otp
    } = req.body || {};

    const targetEmail =
      email
        ? normalizeEmail(email)
        : null;

    const targetPhone =
      phone
        ? normalizePhone(phone)
        : null;

    if (
      !otp ||
      (
        !targetEmail &&
        !targetPhone
      )
    ) {
      return res.status(400).json({
        error:
          'Missing reset verification details.'
      });
    }

    const query =
      targetEmail
        ? {
            email:
              targetEmail
          }
        : {
            phone:
              targetPhone
          };

    const user =
      await User.findOne(query);

    if (
      !user ||
      !user.otp
    ) {
      return res.status(400).json({
        error:
          'Reset code not found. Please request a new one.'
      });
    }

    if (
      !user.otp.expiresAt ||
      new Date() >
        new Date(
          user.otp.expiresAt
        )
    ) {
      user.otp = undefined;

      await user.save();

      return res.status(400).json({
        error:
          'Reset code expired. Please request a new one.'
      });
    }

    if (
      (user.otp.attempts || 0) >=
      MAX_OTP_ATTEMPTS
    ) {
      user.otp = undefined;

      await user.save();

      return res.status(400).json({
        error:
          'Too many failed attempts. Please request a new code.'
      });
    }

    const isValid =
      await compareHash(
        String(otp).trim(),
        user.otp.code
      );

    if (!isValid) {
      user.otp.attempts =
        (user.otp.attempts || 0) +
        1;

      await user.save();

      return res.status(400).json({
        error:
          'Invalid reset code. Please try again.'
      });
    }

    return res.json({
      success: true,

      message:
        'Reset OTP verified successfully.'
    });
  } catch (error) {
    console.error(
      'VERIFY RESET OTP ERROR:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to verify reset OTP.'
    });
  }
};

// ============================================================
// GOOGLE LOGIN
// ============================================================

exports.google = async (
  req,
  res
) => {
  try {
    const {
      idToken
    } = req.body || {};

    if (!idToken) {
      return res.status(400).json({
        error:
          'Google sign-in token is required.'
      });
    }

    if (!googleClient) {
      return res.status(500).json({
        error:
          'Google authentication is not configured on the server.'
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        error:
          'GOOGLE_CLIENT_ID is missing from server environment.'
      });
    }

    const ticket =
      await googleClient.verifyIdToken({
        idToken,

        audience:
          process.env.GOOGLE_CLIENT_ID
      });

    const payload =
      ticket.getPayload();

    if (
      !payload ||
      !payload.email
    ) {
      return res.status(400).json({
        error:
          'Unable to verify your Google account.'
      });
    }

    const email =
      normalizeEmail(
        payload.email
      );

    const googleId =
      payload.sub;

    let user =
      await User.findOne({
        $or: [
          {
            email
          },
          {
            googleId
          }
        ]
      });

    // ========================================================
    // CREATE GOOGLE USER
    // ========================================================

    if (!user) {
      const baseUsername =
        (
          payload.name ||
          email.split('@')[0] ||
          'resume_user'
        )
          .replace(
            /[^a-zA-Z0-9_.-]/g,
            ''
          )
          .slice(0, 25) ||
          'resume_user';

      let username =
        baseUsername;

      let counter = 1;

      while (
        await User.findOne({
          username
        })
      ) {
        username =
          `${baseUsername}${counter}`;

        counter += 1;
      }

      user =
        new User({
          username,

          email,

          name:
            payload.name ||
            username,

          googleId,

          provider:
            'google',

          isVerified:
            true,

          emailVerified:
            true,

          termsAccepted:
            true,

          passwordHash:
            null
        });

      await user.save();
    } else {
      // ======================================================
      // EXISTING USER
      // ======================================================

      user.googleId =
        googleId;

      if (!user.provider) {
        user.provider =
          'google';
      }

      user.isVerified =
        true;

      user.emailVerified =
        true;

      if (!user.email) {
        user.email =
          email;
      }

      if (!user.name) {
        user.name =
          payload.name ||
          user.username;
      }

      await user.save();
    }

    const token =
      issueToken(user);

    const refreshToken =
      await createRefreshTokenForUser(
        user
      );

    user.lastLoginAt =
      new Date();

    await user.save();

    res.cookie(
      'refreshToken',
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.json({
      success: true,

      token,

      user: {
        id:
          user._id,

        username:
          user.username,

        email:
          user.email,

        phone:
          user.phone || null,

        name:
          user.name,

        provider:
          user.provider
      }
    });
  } catch (error) {
    console.error(
      'GOOGLE LOGIN ERROR:',
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        'Unable to sign in with Google. Please try again.'
    });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

exports.forgotPassword = async (
  req,
  res
) => {
  try {
    const {
      identifier
    } = req.body || {};

    if (!identifier) {
      return res.status(400).json({
        error:
          'Please enter your email, phone number, or username.'
      });
    }

    const lookup =
      getUserByIdentifier(
        identifier
      );

    if (!lookup) {
      return res.status(400).json({
        error:
          'Invalid account identifier.'
      });
    }

    const conditions = [];

    if (lookup.email) {
      conditions.push({
        email:
          lookup.email
      });
    }

    if (lookup.phone) {
      conditions.push({
        phone:
          lookup.phone
      });
    }

    if (lookup.username) {
      conditions.push({
        username:
          lookup.username
      });
    }

    const user =
      await User.findOne({
        $or: conditions
      });

    if (!user) {
      return res.status(404).json({
        error:
          'No matching account was found.'
      });
    }

    const targetEmail =
      user.email || null;

    const targetPhone =
      user.phone || null;

    if (
      !targetEmail &&
      !targetPhone
    ) {
      return res.status(400).json({
        error:
          'This account does not have a recoverable email or phone number.'
      });
    }

    await prepareOtpForUser(
      user,
      {
        email:
          targetEmail,

        phone:
          targetPhone
      }
    );

    return res.json({
      success: true,

      message:
        'Reset code sent successfully.',

      destination:
        targetEmail
          ? {
              email:
                targetEmail
            }
          : {
              phone:
                targetPhone
            }
    });
  } catch (error) {
    console.error(
      'FORGOT PASSWORD ERROR:',
      error
    );

    return res.status(400).json({
      error:
        error.message ||
        'Unable to process password reset. Please try again.'
    });
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================

exports.resetPassword = async (
  req,
  res
) => {
  try {
    const {
      email,
      phone,
      otp,
      newPassword,
      confirmPassword
    } = req.body || {};

    const targetEmail =
      email
        ? normalizeEmail(email)
        : null;

    const targetPhone =
      phone
        ? normalizePhone(phone)
        : null;

    if (
      !otp ||
      (
        !targetEmail &&
        !targetPhone
      )
    ) {
      return res.status(400).json({
        error:
          'Missing reset details.'
      });
    }

    if (
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        error:
          'Please provide a new password and confirm it.'
      });
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return res.status(400).json({
        error:
          'Passwords do not match.'
      });
    }

    if (
      newPassword.length < 8
    ) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters long.'
      });
    }

    const query =
      targetEmail
        ? {
            email:
              targetEmail
          }
        : {
            phone:
              targetPhone
          };

    const user =
      await User.findOne(query);

    if (
      !user ||
      !user.otp
    ) {
      return res.status(400).json({
        error:
          'Reset code not found. Please request a new one.'
      });
    }

    if (
      !user.otp.expiresAt ||
      new Date() >
        new Date(
          user.otp.expiresAt
        )
    ) {
      user.otp = undefined;

      await user.save();

      return res.status(400).json({
        error:
          'Reset code expired. Please request a new one.'
      });
    }

    if (
      (user.otp.attempts || 0) >=
      MAX_OTP_ATTEMPTS
    ) {
      user.otp = undefined;

      await user.save();

      return res.status(400).json({
        error:
          'Too many failed attempts. Please request a new code.'
      });
    }

    const isValid =
      await compareHash(
        String(otp).trim(),
        user.otp.code
      );

    if (!isValid) {
      user.otp.attempts =
        (user.otp.attempts || 0) +
        1;

      await user.save();

      return res.status(400).json({
        error:
          'Invalid reset code. Please try again.'
      });
    }

    user.passwordHash =
      await hashValue(
        newPassword
      );

    user.isVerified =
      true;

    user.otp =
      undefined;

    // Invalidate all old refresh tokens
    user.refreshTokens = [];

    await user.save();

    return res.json({
      success: true,

      message:
        'Password reset successfully.'
    });
  } catch (error) {
    console.error(
      'RESET PASSWORD ERROR:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to reset password. Please try again.'
    });
  }
};

// ============================================================
// REFRESH
// ============================================================

exports.refresh = async (
  req,
  res
) => {
  try {
    const {
      refreshToken
    } = req.cookies || {};

    if (!refreshToken) {
      return res.status(401).json({
        error:
          'No refresh token.'
      });
    }

    const user =
      await User.findOne({
        'refreshTokens.token':
          refreshToken
      });

    if (!user) {
      return res.status(401).json({
        error:
          'Invalid refresh token.'
      });
    }

    // Rotate refresh token
    user.refreshTokens =
      (user.refreshTokens || [])
        .filter(
          item =>
            item.token !==
            refreshToken
        );

    const newRefreshToken =
      crypto.randomBytes(48)
        .toString('hex');

    user.refreshTokens.push({
      token:
        newRefreshToken,

      createdAt:
        new Date()
    });

    if (
      user.refreshTokens.length >
      10
    ) {
      user.refreshTokens =
        user.refreshTokens.slice(-10);
    }

    await user.save();

    const token =
      issueToken(user);

    res.cookie(
      'refreshToken',
      newRefreshToken,
      getRefreshCookieOptions()
    );

    return res.json({
      success: true,

      token
    });
  } catch (error) {
    console.error(
      'REFRESH ERROR:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to refresh session.'
    });
  }
};

// ============================================================
// LOGOUT
// ============================================================

exports.logout = async (
  req,
  res
) => {
  try {
    const {
      refreshToken
    } = req.cookies || {};

    if (refreshToken) {
      await User.updateMany(
        {
          'refreshTokens.token':
            refreshToken
        },
        {
          $pull: {
            refreshTokens: {
              token:
                refreshToken
            }
          }
        }
      );
    }

    res.clearCookie(
      'refreshToken',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite:
          process.env.NODE_ENV ===
          'production'
            ? 'none'
            : 'lax',
        path: '/'
      }
    );

    return res.json({
      success: true
    });
  } catch (error) {
    console.error(
      'LOGOUT ERROR:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to logout.'
    });
  }
};

// ============================================================
// ME
// ============================================================

exports.me = async (
  req,
  res
) => {
  try {
    const auth =
      req.headers.authorization ||
      '';

    const token =
      auth.replace(
        /^Bearer\s+/i,
        ''
      ).trim();

    if (!token) {
      return res.status(401).json({
        error:
          'Unauthorized.'
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        error:
          'JWT_SECRET is not configured.'
      });
    }

    const data =
      jwt.verify(
        token,
        JWT_SECRET
      );

    const user =
      await User.findById(
        data.userId
      ).select(
        '-refreshTokens -otp'
      );

    if (!user) {
      return res.status(401).json({
        error:
          'User not found.'
      });
    }

    return res.json({
      success: true,

      user
    });
  } catch (error) {
    console.error(
      'ME ERROR:',
      error.message
    );

    return res.status(401).json({
      error:
        'Unauthorized.'
    });
  }
};

// ============================================================
// CONFIG
// ============================================================

exports.config = async (
  req,
  res
) => {
  try {
    return res.json({
      success: true,

      config: {
        googleClientId:
          process.env.GOOGLE_CLIENT_ID ||
          null,

        smtpConfigured:
          !!(
            process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS
          ),

        smsConfigured:
          !!(
            process.env.TWILIO_ACCOUNT_SID &&
            process.env.TWILIO_AUTH_TOKEN &&
            process.env.TWILIO_FROM_NUMBER
          )
      }
    });
  } catch (error) {
    console.error(
      'AUTH CONFIG ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      error:
        'Unable to read auth config.'
    });
  }
};
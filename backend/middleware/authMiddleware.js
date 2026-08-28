const jwt = require('jsonwebtoken');

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev_secret_change_me';

// ============================================================
// PUBLIC ROUTES
// ============================================================

const PUBLIC_ROUTES = [
  '/api/career-advice',
  '/api/interview-questions',
  '/api/skill-market',
  '/api/career-simulation',
  '/api/upload'
];

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

exports.requireAuth = (req, res, next) => {
  try {
    // --------------------------------------------------------
    // Check public route
    // --------------------------------------------------------

    const isPublic = PUBLIC_ROUTES.some((route) =>
      req.path.startsWith(route)
    );

    if (isPublic) {
      console.log('🟢 Public route accessed:', req.path);
      return next();
    }

    // --------------------------------------------------------
    // Get Bearer token
    // --------------------------------------------------------

    const authHeader =
      req.headers.authorization || '';

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace(
      /^Bearer\s+/i,
      ''
    ).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
        code: 'NO_TOKEN'
      });
    }

    // --------------------------------------------------------
    // Verify JWT
    // --------------------------------------------------------

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    // --------------------------------------------------------
    // IMPORTANT
    // authController.issueToken() uses userId
    // --------------------------------------------------------

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach decoded user/token data
    req.user = decoded;

    next();

  } catch (err) {

    // --------------------------------------------------------
    // Expired JWT
    // --------------------------------------------------------

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.',
        expired: true,
        code: 'TOKEN_EXPIRED'
      });
    }

    // --------------------------------------------------------
    // Invalid JWT
    // --------------------------------------------------------

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    // --------------------------------------------------------
    // Generic authentication error
    // --------------------------------------------------------

    console.error(
      'Authentication middleware error:',
      err
    );

    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// ============================================================
// GENERATE TOKEN
// Keep same payload structure as authController.issueToken()
// ============================================================

exports.generateToken = (
  userId,
  email,
  username = null,
  phone = null,
  provider = 'local'
) => {
  return jwt.sign(
    {
      userId: String(userId),
      username,
      email,
      phone,
      provider
    },
    JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXP || '15m'
    }
  );
};

// ============================================================
// VERIFY TOKEN
// ============================================================

exports.verifyToken = (token) => {
  try {
    return jwt.verify(
      token,
      JWT_SECRET
    );
  } catch (err) {
    return null;
  }
};
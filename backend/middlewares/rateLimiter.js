const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Scan upload rate limiter
const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 scans per hour
  message: 'Too many scan uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Chatbot rate limiter
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 messages per 15 minutes
  message: 'Too many messages, please wait before asking another question.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Community post creation limiter
const communityPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many community posts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Community comments/likes limiter
const communityCommentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  message: 'Too many community interactions. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  scanLimiter,
  chatLimiter,
  communityPostLimiter,
  communityCommentLimiter
};


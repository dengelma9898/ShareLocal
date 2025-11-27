// Rate Limiting Middleware
// Schutz gegen Brute-Force Attacks und API-Missbrauch

import rateLimit from 'express-rate-limit';
// Logger kann später für Rate Limit Logging verwendet werden
// import { logger } from '../../../utils/logger.js';

/**
 * Rate Limiter für Authentication-Endpoints
 * 5 Versuche pro 15 Minuten pro IP
 * Schutz gegen Brute-Force Attacks
 * 
 * In Tests: Rate Limiting ist aktiv, aber mit höheren Limits für normale Tests
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // In Tests: sehr hohes Limit, sonst 5
  message: {
    error: 'Zu viele Login-Versuche',
    message: 'Bitte versuchen Sie es später erneut. Maximal 5 Versuche pro 15 Minuten.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate Limiter für allgemeine API-Endpoints
 * 100 Requests pro 15 Minuten pro IP
 * Schutz gegen API-Missbrauch und DDoS
 * 
 * In Tests: Rate Limiting ist aktiv, aber mit höheren Limits für normale Tests
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: process.env.NODE_ENV === 'test' ? 10000 : 100, // In Tests: sehr hohes Limit, sonst 100
  message: {
    error: 'Zu viele Anfragen',
    message: 'Bitte versuchen Sie es später erneut. Maximal 100 Anfragen pro 15 Minuten.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strikter Rate Limiter für sensible Operationen
 * 10 Requests pro Stunde pro IP
 * Für z.B. Password Reset, Email Verification, etc.
 * 
 * In Tests: Rate Limiting ist aktiv, aber mit höheren Limits für normale Tests
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // In Tests: sehr hohes Limit, sonst 10
  message: {
    error: 'Zu viele Anfragen',
    message: 'Bitte versuchen Sie es später erneut. Maximal 10 Anfragen pro Stunde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


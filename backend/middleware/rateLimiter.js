const rateLimit = require('express-rate-limit');

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many AI requests — please wait a moment and try again.' },
});

module.exports = { aiRateLimit };

const pino = require('pino');
const { env } = require('../config/env');

const isDev = env.nodeEnv !== 'production';

const logger = pino(
  {
    level: isDev ? 'debug' : 'info',
    // Redact tokens and keys from structured logs.
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: { service: 'anubis-backend' },
  },
  isDev ? pino.transport({ target: 'pino-pretty', options: { colorize: true } }) : undefined
);

module.exports = logger;

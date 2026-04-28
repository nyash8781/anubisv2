const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.2,
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');

const { env, getServiceStatus } = require('./config/env');
const aiProvider = require('./ai-provider');
const logger = require('./lib/logger');

const jobsRouter = require('./routes/jobs');
const aiRouter = require('./routes/ai');
const statsRouter = require('./routes/stats');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = env.port;

// --- Security headers -------------------------------------------------------
app.use(helmet());

// --- CORS -------------------------------------------------------------------
const allowedOrigins = env.corsOrigins;
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

// --- HTTP request logging ---------------------------------------------------
app.use(pinoHttp({ logger }));

// Keep body limit tight — large payloads are a DoS surface.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// --- Utility routes (no auth) -----------------------------------------------
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'anubis-backend',
    version: '0.2.0',
    aiProvider: aiProvider.AI_PROVIDER,
    services: getServiceStatus(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Feature routes ---------------------------------------------------------
app.use('/jobs', jobsRouter);
app.use('/', aiRouter);
app.use('/', statsRouter);
app.use('/', settingsRouter);

// --- Sentry error handler (must be before custom error handler) ------------
Sentry.setupExpressErrorHandler(app);

// --- Global error handler ---------------------------------------------------
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = env.nodeEnv === 'development';
  logger[status >= 500 ? 'error' : 'warn'](
    { method: req.method, path: req.path, status, err: isDev ? err : undefined },
    err.message
  );
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({
    error: message,
    ...(isDev && status >= 500 ? { stack: err.stack } : {}),
  });
});

app.listen(PORT, () => {
  const { ai } = getServiceStatus();
  logger.info({ port: PORT, aiConfigured: ai.configured }, 'anubis-backend started');
  if (!ai.configured) {
    logger.warn('ANTHROPIC_API_KEY missing — AI endpoints will fail. Set it in backend/.env');
  }
});

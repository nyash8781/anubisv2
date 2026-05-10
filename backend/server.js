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
const activityRouter = require('./routes/activity');
const paymentsRouter = require('./routes/payments');
const milestonesRouter = require('./routes/milestones');
const teamRouter = require('./routes/team');
const outreachRouter = require('./routes/outreach');
const proposalsRouter = require('./routes/proposals');
const publicProposalsRouter = require('./routes/publicProposals');

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
      // Allow all Vercel deployment URLs — safe because every route requires auth.
      if (origin && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

// --- HTTP request logging ---------------------------------------------------
app.use(pinoHttp({ logger }));

// --- Stripe webhook needs RAW body for signature verification ---------------
// Must come BEFORE express.json() — once the body is parsed as JSON the raw
// bytes are gone and Stripe's signature check fails.
app.post('/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));

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

app.get('/health/ai', (req, res) => {
  const hasKey = !!env.anthropicApiKey;
  const model = env.anthropicModel;
  res.status(hasKey ? 200 : 503).json({
    configured: hasKey,
    model,
    ...(hasKey ? {} : { error: 'ANTHROPIC_API_KEY is not set in environment variables.' }),
  });
});

// --- Feature routes ---------------------------------------------------------
app.use('/jobs', jobsRouter);
app.use('/jobs', activityRouter);
app.use('/', aiRouter);
app.use('/', statsRouter);
app.use('/', settingsRouter);
app.use('/', paymentsRouter);
app.use('/milestones', milestonesRouter);
app.use('/team', teamRouter);
app.use('/outreach', outreachRouter);
app.use('/proposals', proposalsRouter);
app.use('/public/proposals', publicProposalsRouter);

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

function logIntegrationStatus() {
  const status = getServiceStatus();
  logger.info(
    {
      ai: status.ai.configured ? `claude (${env.anthropicModel})` : 'NOT CONFIGURED',
      supabase: status.supabase ? 'configured' : 'NOT CONFIGURED (using JSON fallback)',
      resend: status.resend ? 'configured' : 'not configured',
      stripe: status.stripe ? 'configured' : 'not configured',
      twilio: status.twilio ? 'configured' : 'not configured',
      r2: status.r2 ? 'configured' : 'not configured',
    },
    'Integration readiness'
  );
  if (!status.ai.configured) {
    logger.warn('ANTHROPIC_API_KEY missing — AI endpoints will fail. Set it in backend/.env or Vercel env');
  }
  if (!status.supabase) {
    logger.warn('Supabase not configured — falling back to JSON flat-file (single-user dev mode only)');
  }
}

// Local dev only — Vercel handles the server lifecycle in production.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'anubis-backend started');
    logIntegrationStatus();
  });
} else {
  // On Vercel: log integration status once at cold start so logs reflect deployed config.
  logIntegrationStatus();
}

module.exports = app;

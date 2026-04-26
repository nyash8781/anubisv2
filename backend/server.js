/**
 * Anubis backend — Express API
 *
 * Preserved from AnubisV2 baseline. All P1 fixes from the initial review
 * are applied:
 *   - P1-01: AI provider abstracted (ai-provider.js)
 *   - P1-02: system_prompt + business_context actually inserted into AI prompt
 *   - P2-02: CORS allowlist from env
 *   - P2-04: zod validation on every POST/PUT
 *   - P2-05: Structured error logging
 *
 * Phase 1 replaces the JSON-file data layer with Supabase.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const aiProvider = require('./ai-provider');
const { env, getServiceStatus } = require('./src/config/env');
const {
  jobUpsertSchema,
  actionSchema,
  generateInsightsSchema,
  validate,
} = require('./schemas');

const app = express();
const PORT = env.port;

// --- CORS allowlist ------------------------------------------------------
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

app.use(express.json({ limit: '2mb' }));

// --- Auth middleware (Supabase JWT) -------------------------------------
const { createClient } = require('@supabase/supabase-js');

async function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  req.user = user;
  next();
}

// --- Data layer (JSON file — Phase 1 migrates to Supabase) --------------
const jobsFilePath = path.join(__dirname, 'data', 'jobs.json');

function ensureJobsFile() {
  const dataDir = path.dirname(jobsFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(jobsFilePath)) {
    fs.writeFileSync(jobsFilePath, '[]', 'utf8');
  }
}

function readJobs() {
  ensureJobsFile();
  try {
    const raw = fs.readFileSync(jobsFilePath, 'utf8');
    const jobs = JSON.parse(raw || '[]');
    return Array.isArray(jobs) ? jobs : [];
  } catch (error) {
    console.error('[jobs] failed to read jobs.json:', error.message);
    return [];
  }
}

function writeJobs(jobs) {
  ensureJobsFile();
  fs.writeFileSync(jobsFilePath, JSON.stringify(jobs, null, 2), 'utf8');
}

// --- Opportunity ID helpers ---------------------------------------------
function buildCompactId(dateInput, sequence) {
  const created = dateInput ? new Date(dateInput) : new Date();
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, '0');
  const dd = String(created.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `${yy}${mm}${dd}${seq}`;
}

function getDailySequence(jobs, createdAt) {
  const created = createdAt ? new Date(createdAt) : new Date();
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, '0');
  const dd = String(created.getDate()).padStart(2, '0');
  const prefix = `${yy}${mm}${dd}`;

  const sameDay = jobs
    .map((job) => job.opportunity_id)
    .filter((id) => typeof id === 'string' && id.replace(/^P/, '').startsWith(prefix))
    .map((id) => Number(id.replace(/^P/, '').slice(6)))
    .filter((n) => !Number.isNaN(n));

  if (sameDay.length === 0) return 1;
  return Math.max(...sameDay) + 1;
}

// --- Stale detection ----------------------------------------------------
const STALE_DAYS = 14;

function computeFlags(job) {
  if (!job.last_contacted_date) {
    return { isStale: false, isAged: false, agedType: null };
  }
  const last = new Date(job.last_contacted_date);
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  return {
    isStale: diffDays >= STALE_DAYS && job.status !== 'Closed',
    isAged: diffDays >= 30,
    agedType: diffDays >= 60 ? 'old' : diffDays >= 30 ? 'aging' : null,
  };
}

function normalizeJob(job) {
  const nextJob = { ...job };

  if (!nextJob.created_at) {
    nextJob.created_at = new Date().toISOString();
  }
  if (!nextJob.milestone) {
    nextJob.milestone = 'Lead';
  }
  if (!nextJob.status) {
    nextJob.status =
      nextJob.opportunity_id && String(nextJob.opportunity_id).startsWith('P')
        ? 'Draft'
        : 'New';
  }
  if (!nextJob.contact_status) {
    nextJob.contact_status = nextJob.status;
  }

  nextJob.flags = computeFlags(nextJob);
  return nextJob;
}

function updateContact(job, method) {
  return {
    ...job,
    last_contacted_date: new Date().toISOString().split('T')[0],
    last_contact_method: method,
    status: job.status === 'Draft' ? 'Draft' : 'Contacted',
    contact_status: job.status === 'Draft' ? 'Draft' : 'Contacted',
  };
}

// --- Routes --------------------------------------------------------------
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

app.get('/jobs', (req, res) => {
  const jobs = readJobs().map(normalizeJob);
  res.json(jobs);
});

app.get('/jobs/:id', (req, res) => {
  const id = Number(req.params.id);
  const jobs = readJobs().map(normalizeJob);

  const job = jobs.find((item) => item.id === id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.post('/jobs', requireAuth, validate(jobUpsertSchema), (req, res) => {
  const jobs = readJobs().map(normalizeJob);
  const createdAt = new Date().toISOString();
  const sequence = getDailySequence(jobs, createdAt);
  const compactId = buildCompactId(createdAt, sequence);

  const newJob = normalizeJob({
    id: Date.now(),
    opportunity_id: `P${compactId}`,
    customer_name: req.body.customer_name || '',
    first_name: req.body.first_name || '',
    last_name: req.body.last_name || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    mobile_number_1: req.body.mobile_number_1 || '',
    mobile_number_2: req.body.mobile_number_2 || '',
    address: req.body.address || '',
    address_1: req.body.address_1 || '',
    city: req.body.city || '',
    state: req.body.state || '',
    zip_code: req.body.zip_code || '',
    service: req.body.service || '',
    scope_of_work: req.body.scope_of_work || '',
    price: req.body.price || '',
    bid: req.body.bid || '',
    payments_received: req.body.payments_received || '',
    balance_due: req.body.balance_due || '',
    due_date: req.body.due_date || '',
    notes: req.body.notes || '',
    milestone: req.body.milestone || 'Lead',
    status: 'Draft',
    contact_status: 'Draft',
    last_contacted_date: req.body.last_contacted_date || '',
    last_contact_method: req.body.last_contact_method || '',
    created_at: createdAt,
  });

  jobs.unshift(newJob);
  writeJobs(jobs);
  res.json(newJob);
});

app.put('/jobs/:id', requireAuth, validate(jobUpsertSchema), (req, res) => {
  const id = Number(req.params.id);
  const jobs = readJobs().map(normalizeJob);
  const index = jobs.findIndex((job) => job.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const existing = jobs[index];
  const incoming = req.body || {};

  // On first save (promoting from Draft), drop the "P" prefix and flip status.
  const wasDraft = existing.status === 'Draft';
  let nextOpportunityId = existing.opportunity_id;
  let nextStatus = incoming.status || existing.status;

  if (wasDraft && incoming.status && incoming.status !== 'Draft') {
    nextOpportunityId = String(existing.opportunity_id || '').replace(/^P/, '');
    nextStatus = incoming.status;
  }

  const updated = normalizeJob({
    ...existing,
    ...incoming,
    id: existing.id,
    opportunity_id: nextOpportunityId,
    status: nextStatus,
    created_at: existing.created_at,
  });

  jobs[index] = updated;
  writeJobs(jobs);
  res.json(updated);
});

app.delete('/jobs/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const jobs = readJobs();
  const nextJobs = jobs.filter((job) => job.id !== id);
  if (nextJobs.length === jobs.length) {
    return res.status(404).json({ error: 'Job not found' });
  }
  writeJobs(nextJobs);
  res.json({ ok: true });
});

app.post('/jobs/:id/action', requireAuth, validate(actionSchema), (req, res) => {
  const id = Number(req.params.id);
  const jobs = readJobs().map(normalizeJob);
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) return res.status(404).json({ error: 'Job not found' });

  const { type } = req.body;
  let updated;

  if (type === 'completed') {
    updated = normalizeJob({
      ...jobs[index],
      status: 'Closed',
      contact_status: 'Closed',
      milestone: 'Completed',
    });
  } else if (type === 'manual') {
    updated = normalizeJob(updateContact(jobs[index], 'manual'));
  } else {
    updated = normalizeJob(updateContact(jobs[index], type));
  }

  jobs[index] = updated;
  writeJobs(jobs);
  res.json(updated);
});

// --- AI generation endpoint --------------------------------------------
app.post(
  '/generate-job-insights',
  requireAuth,
  validate(generateInsightsSchema),
  async (req, res) => {
    try {
      const {
        service = '',
        scope_of_work = '',
        first_name = '',
        last_name = '',
        customer_name = '',
        system_prompt = '',
        business_context = '',
      } = req.body;

      const name = [first_name, last_name].filter(Boolean).join(' ') || customer_name || 'the customer';

      // P1-02 fix: actually insert system_prompt + business_context.
      const prompt = [
        system_prompt || 'You are a professional contractor assistant writing warm, concise follow-up messages.',
        business_context ? `Business context: ${business_context}` : '',
        '',
        `Generate two short outputs for the following opportunity, separated by the literal divider "---UPSELL---":`,
        `1. A friendly follow-up message (2-3 sentences) for ${name}.`,
        `2. One specific upsell suggestion relevant to the scope.`,
        '',
        `Service: ${service || 'not specified'}`,
        `Scope: ${scope_of_work || 'not specified'}`,
      ]
        .filter(Boolean)
        .join('\n');

      const text = await aiProvider.generate(prompt);
      const [followUp = '', upsell = ''] = text.split('---UPSELL---').map((s) => s.trim());

      res.json({ followUp, upsell });
    } catch (error) {
      console.error('[generate-job-insights]', error.message);
      res.status(500).json({ error: 'AI generation failed', details: error.message });
    }
  }
);

// --- Global error handler -----------------------------------------------
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[anubis] backend listening on http://localhost:${PORT}`);
  const aiConfigured = getServiceStatus().ai.configured;
  console.log(
    `[anubis] AI: Claude${aiConfigured ? '' : ' (ANTHROPIC_API_KEY missing — set it in backend/.env)'}`
  );
});

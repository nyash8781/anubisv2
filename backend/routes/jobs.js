const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db');
const { buildCompactId, getDailySequence, normalizeJob, updateContact } = require('../services/jobService');
const { jobUpsertSchema, actionSchema, validate } = require('../schemas');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const jobs = await getDb(req.user.id).readJobs();
    res.json(jobs.map(normalizeJob));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const job = await getDb(req.user.id).findJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(normalizeJob(job));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, validate(jobUpsertSchema), async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const createdAt = new Date().toISOString();
    const existingJobs = await db.readJobs();
    const sequence = getDailySequence(existingJobs, createdAt);
    const compactId = buildCompactId(createdAt, sequence);

    const newJob = normalizeJob({
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

    const saved = await db.createJob(newJob);
    res.json(normalizeJob(saved));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, validate(jobUpsertSchema), async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const existing = await db.findJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const incoming = req.body || {};
    const wasDraft = existing.status === 'Draft';
    let nextOpportunityId = existing.opportunity_id;
    let nextStatus = incoming.status || existing.status;

    if (wasDraft && incoming.status && incoming.status !== 'Draft') {
      nextOpportunityId = String(existing.opportunity_id || '').replace(/^P/, '');
      nextStatus = incoming.status;
    }

    const merged = normalizeJob({
      ...existing,
      ...incoming,
      id: existing.id,
      opportunity_id: nextOpportunityId,
      status: nextStatus,
      created_at: existing.created_at,
    });

    const saved = await db.updateJob(existing.id, merged);
    res.json(normalizeJob(saved));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await getDb(req.user.id).deleteJob(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Job not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/action', requireAuth, validate(actionSchema), async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const job = await db.findJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { type } = req.body;
    let updated;

    if (type === 'completed') {
      updated = normalizeJob({ ...job, status: 'Closed', contact_status: 'Closed', milestone: 'Completed' });
    } else if (type === 'manual') {
      updated = normalizeJob(updateContact(job, 'manual'));
    } else {
      updated = normalizeJob(updateContact(job, type));
    }

    const saved = await db.updateJob(job.id, updated);
    res.json(normalizeJob(saved));
  } catch (err) {
    next(err);
  }
});

module.exports = router;

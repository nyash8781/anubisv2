const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db');
const { buildCompactId, getDailySequence, normalizeJob, updateContact } = require('../services/jobService');
const { logActivity } = require('../services/activityService');
const { jobUpsertSchema, actionSchema, validate } = require('../schemas');

const router = express.Router();

function projectLabel(job) {
  return [`${job.first_name || ''} ${job.last_name || ''}`.trim(), job.service]
    .filter(Boolean).join(' — ') || `Job #${job.id}`;
}

// Fetch user settings once per request (swallows errors; returns empty object on failure).
async function getUserSettings(db) {
  try {
    return await db.getSettings();
  } catch {
    return {};
  }
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const [jobs, settings] = await Promise.all([db.readJobs(), getUserSettings(db)]);
    res.json(jobs.map((j) => normalizeJob(j, settings)));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const [job, settings] = await Promise.all([
      db.findJobById(req.params.id),
      getUserSettings(db),
    ]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(normalizeJob(job, settings));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, validate(jobUpsertSchema), async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const settings = await getUserSettings(db);

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
      milestone: req.body.milestone || settings.default_new_milestone || 'Lead',
      status: settings.default_new_status || 'Draft',
      contact_status: settings.default_new_status || 'Draft',
      last_contacted_date: req.body.last_contacted_date || '',
      last_contact_method: req.body.last_contact_method || '',
      created_at: createdAt,
    }, settings);

    const saved = await db.createJob(newJob);

    await logActivity(db, {
      jobId: saved.id,
      userId: req.user.id,
      projectName: projectLabel(saved),
      action: 'Job Created',
      description: `Job opportunity created at milestone: ${saved.milestone || 'Lead'}`,
      activityType: 'job_created',
      metadata: { milestone: saved.milestone, status: saved.status },
    });

    res.json(normalizeJob(saved, settings));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, validate(jobUpsertSchema), async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const [existing, settings] = await Promise.all([
      db.findJobById(req.params.id),
      getUserSettings(db),
    ]);
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
    }, settings);

    const saved = await db.updateJob(existing.id, merged);
    const label = projectLabel(saved);

    // Log milestone change
    if (incoming.milestone && incoming.milestone !== existing.milestone) {
      await logActivity(db, {
        jobId: saved.id, userId: req.user.id, projectName: label,
        action: 'Stage Changed',
        description: `Stage moved from ${existing.milestone} to ${incoming.milestone}`,
        activityType: 'milestone_changed',
        metadata: { from: existing.milestone, to: incoming.milestone },
      });
    }

    // Log status change
    if (incoming.status && incoming.status !== existing.status) {
      await logActivity(db, {
        jobId: saved.id, userId: req.user.id, projectName: label,
        action: 'Status Changed',
        description: `Status changed from ${existing.status} to ${incoming.status}`,
        activityType: 'status_changed',
        metadata: { from: existing.status, to: incoming.status },
      });
    }

    // Log production status change
    if (incoming.production_status && incoming.production_status !== existing.production_status) {
      const isBlocked = incoming.production_status === 'Blocked';
      const wasBlocked = existing.production_status === 'Blocked';
      await logActivity(db, {
        jobId: saved.id, userId: req.user.id, projectName: label,
        action: isBlocked ? 'Production Blocked' : wasBlocked ? 'Blocker Cleared' : 'Production Updated',
        description: isBlocked
          ? `Production blocked${incoming.production_blocker ? ': ' + incoming.production_blocker : ''}`
          : wasBlocked
            ? 'Production blocker cleared'
            : `Production status changed to ${incoming.production_status}`,
        activityType: isBlocked ? 'production_blocked' : wasBlocked ? 'production_unblocked' : 'production_update',
        metadata: { from: existing.production_status, to: incoming.production_status },
      });
    }

    // Log payment status change
    if (incoming.payment_status && incoming.payment_status !== existing.payment_status) {
      await logActivity(db, {
        jobId: saved.id, userId: req.user.id, projectName: label,
        action: 'Payment Status Changed',
        description: `Payment status changed to ${incoming.payment_status}`,
        activityType: 'payment_status_changed',
        metadata: { from: existing.payment_status, to: incoming.payment_status },
      });
    }

    // Log general job modification (only if no specific change already logged above)
    const specificChange = (
      (incoming.milestone && incoming.milestone !== existing.milestone) ||
      (incoming.status && incoming.status !== existing.status) ||
      (incoming.production_status && incoming.production_status !== existing.production_status) ||
      (incoming.payment_status && incoming.payment_status !== existing.payment_status)
    );
    if (!specificChange) {
      await logActivity(db, {
        jobId: saved.id, userId: req.user.id, projectName: label,
        action: 'Job Updated',
        description: 'Job opportunity details updated',
        activityType: 'job_modified',
        metadata: {},
      });
    }

    res.json(normalizeJob(saved, settings));
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
    const [job, settings] = await Promise.all([
      db.findJobById(req.params.id),
      getUserSettings(db),
    ]);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { type } = req.body;
    let updated;

    if (type === 'completed') {
      updated = normalizeJob({ ...job, status: 'Closed', contact_status: 'Closed', milestone: 'Completed' }, settings);
    } else if (type === 'manual') {
      updated = normalizeJob(updateContact(job, 'manual', settings), settings);
    } else {
      updated = normalizeJob(updateContact(job, type, settings), settings);
    }

    const saved = await db.updateJob(job.id, updated);

    const ACTION_LABELS = {
      call: 'Call Logged', text: 'Text Logged', email: 'Email Logged',
      manual: 'Contact Logged', completed: 'Job Completed',
    };
    const ACTION_DESCRIPTIONS = {
      call: 'Phone call logged with client',
      text: 'Text message logged with client',
      email: 'Email logged with client',
      manual: 'Manual contact action logged',
      completed: 'Job marked as completed',
    };

    await logActivity(db, {
      jobId: saved.id,
      userId: req.user.id,
      projectName: projectLabel(saved),
      action: ACTION_LABELS[type] || 'Action Logged',
      description: ACTION_DESCRIPTIONS[type] || `Action: ${type}`,
      activityType: type,
      metadata: { type },
    });

    res.json(normalizeJob(saved, settings));
  } catch (err) {
    next(err);
  }
});

module.exports = router;

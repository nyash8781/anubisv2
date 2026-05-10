const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db');
const { validate } = require('../schemas');
const { logActivity, getActivity } = require('../services/activityService');

const router = express.Router();

const activityCreateSchema = z.object({
  action: z.string().trim().min(1),
  description: z.string().trim().default(''),
  activity_type: z.string().trim().default('manual'),
  project_name: z.string().trim().default(''),
  metadata: z.record(z.unknown()).optional(),
});

router.get('/:id/activity', requireAuth, async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const job = await db.findJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const activities = await getActivity(db, job.id, limit);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/activity', requireAuth, validate(activityCreateSchema), async (req, res, next) => {
  try {
    const db = getDb(req.user.id);
    const job = await db.findJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const projectName = req.body.project_name ||
      [`${job.first_name || ''} ${job.last_name || ''}`.trim(), job.service].filter(Boolean).join(' — ') ||
      `Job #${job.id}`;

    await logActivity(db, {
      jobId: job.id,
      userId: req.user.id,
      projectName,
      action: req.body.action,
      description: req.body.description,
      activityType: req.body.activity_type,
      metadata: req.body.metadata || {},
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

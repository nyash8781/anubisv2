const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db/index');
const logger = require('../lib/logger');

const router = Router();

// Default milestones seeded on first request if none exist
const DEFAULT_MILESTONES = [
  { label: 'Lead',         order_index: 0, stale_days: 30, color: '#3B82F6', is_terminal: false },
  { label: 'Proposal',     order_index: 1, stale_days: 30, color: '#F59E0B', is_terminal: false },
  { label: 'Construction', order_index: 2, stale_days: 14, color: '#F97316', is_terminal: false },
  { label: 'Completed',    order_index: 3, stale_days: 0,  color: '#22C55E', is_terminal: true  },
];

// GET /milestones — list user's milestones (seeds defaults on first call)
router.get('/', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    let milestones = await db.listMilestones(req.user.id);

    // Seed defaults if none exist
    if (!milestones || milestones.length === 0) {
      milestones = await db.seedMilestones(req.user.id, DEFAULT_MILESTONES);
    }

    res.json(milestones);
  } catch (err) {
    logger.error({ err }, 'GET /milestones failed');
    res.status(500).json({ error: 'Failed to load milestones' });
  }
});

// POST /milestones — create a new milestone
router.post('/', requireAuth, async (req, res) => {
  const { label, order_index, stale_days, color, is_terminal } = req.body;
  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'label is required' });
  }
  const db = getDb(req.user.id);
  try {
    const milestone = await db.createMilestone(req.user.id, {
      label: label.trim(),
      order_index: Number(order_index) || 0,
      stale_days: Number(stale_days) ?? 30,
      color: color || '#0052FF',
      is_terminal: Boolean(is_terminal),
    });
    res.status(201).json(milestone);
  } catch (err) {
    logger.error({ err }, 'POST /milestones failed');
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// PUT /milestones/:id — update a milestone
router.put('/:id', requireAuth, async (req, res) => {
  const { label, order_index, stale_days, color, is_terminal } = req.body;
  const db = getDb(req.user.id);
  try {
    const updated = await db.updateMilestone(req.user.id, req.params.id, {
      ...(label !== undefined && { label: label.trim() }),
      ...(order_index !== undefined && { order_index: Number(order_index) }),
      ...(stale_days !== undefined && { stale_days: Number(stale_days) }),
      ...(color !== undefined && { color }),
      ...(is_terminal !== undefined && { is_terminal: Boolean(is_terminal) }),
    });
    if (!updated) return res.status(404).json({ error: 'Milestone not found' });
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'PUT /milestones/:id failed');
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// DELETE /milestones/:id — delete a milestone
router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    await db.deleteMilestone(req.user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'DELETE /milestones/:id failed');
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

// POST /milestones/reorder — batch update order_index
router.post('/reorder', requireAuth, async (req, res) => {
  const { order } = req.body; // [{ id, order_index }]
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
  const db = getDb(req.user.id);
  try {
    await db.reorderMilestones(req.user.id, order);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'POST /milestones/reorder failed');
    res.status(500).json({ error: 'Failed to reorder milestones' });
  }
});

module.exports = router;

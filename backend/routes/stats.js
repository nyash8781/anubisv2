const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const stats = await getDb(req.user.id).getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

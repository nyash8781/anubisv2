const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { settingsSchema, validate } = require('../schemas');
const { supabaseServiceClient } = require('../db/client');

const router = express.Router();

router.get('/settings', requireAuth, async (req, res, next) => {
  if (!supabaseServiceClient) {
    return res.json({ base_prompt: '', business_context: '', extra: {}, persisted: false });
  }
  try {
    const { data, error } = await supabaseServiceClient
      .from('user_settings')
      .select('base_prompt, business_context, extra')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw new Error(`[settings] GET: ${error.message}`);
    res.json(data || { base_prompt: '', business_context: '', extra: {} });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', requireAuth, validate(settingsSchema), async (req, res, next) => {
  if (!supabaseServiceClient) {
    return res.json({ base_prompt: '', business_context: '', extra: {}, persisted: false });
  }
  try {
    const { base_prompt, business_context, extra = {} } = req.body;

    const { data, error } = await supabaseServiceClient
      .from('user_settings')
      .upsert(
        { user_id: req.user.id, base_prompt, business_context, extra },
        { onConflict: 'user_id' }
      )
      .select('base_prompt, business_context, extra')
      .single();

    if (error) throw new Error(`[settings] PUT: ${error.message}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

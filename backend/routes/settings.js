const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { settingsSchema, validate } = require('../schemas');
const { supabaseServiceClient } = require('../db/client');
const planService = require('../services/planService');

const router = express.Router();

// Helper: Get organization ID for a user
async function getOrganizationIdForUser(userId) {
  if (!supabaseServiceClient || !userId) return null;
  const { data } = await supabaseServiceClient
    .from('organizations')
    .select('id')
    .eq('owner_user_id', userId)
    .single();
  return data?.id || null;
}

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

// GET /settings/usage — Contractor usage and plan data (Phase C.6)
router.get('/settings/usage', requireAuth, async (req, res, next) => {
  try {
    const organizationId = await getOrganizationIdForUser(req.user.id);

    if (!organizationId || !supabaseServiceClient) {
      return res.json({
        plan: null,
        usage: [],
        renewalDate: null,
      });
    }

    // Get current plan
    const plan = await planService.getPlanForOrganization(organizationId);

    // Get this month's usage
    const currentMonth = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    const { data: usageData } = await supabaseServiceClient
      .from('usage_monthly_rollups')
      .select('metric_key,total_count,limit_value')
      .eq('organization_id', organizationId)
      .eq('year', year)
      .eq('month', month);

    // Augment usage data with limit info
    const usage = (usageData || []).map((row) => {
      const limit = planService.getEffectiveLimit(row.metric_key, plan);
      return {
        metricKey: row.metric_key,
        used: row.total_count,
        limit,
        percentage: limit === -1 ? 0 : Math.round((row.total_count / limit) * 100),
      };
    });

    res.json({
      plan: plan ? {
        name: plan.name,
        slug: plan.slug,
        priceMonthly: plan.priceMonthly,
        startedAt: plan.startedAt,
      } : null,
      usage,
      renewalDate: plan?.startedAt
        ? new Date(new Date(plan.startedAt).setMonth(new Date(plan.startedAt).getMonth() + 1)).toISOString()
        : null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

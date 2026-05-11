// Plan service — resolves effective plan and limits for an organization
// Phase C.1

const logger = require('../lib/logger');
const { supabaseServiceClient } = require('../db/client');

// Cache plan + limits in memory to avoid repeated queries
const planCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getPlanForOrganization(organizationId) {
  if (!supabaseServiceClient || !organizationId) return null;

  // Check cache first
  const cached = planCache.get(organizationId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Get current (active) plan assignment
    const { data: orgPlan, error: orgPlanError } = await supabaseServiceClient
      .from('organization_plans')
      .select(`
        id,
        plan_id,
        started_at,
        override_limits,
        plans (
          id,
          name,
          slug,
          price_monthly,
          price_annual,
          is_active
        )
      `)
      .eq('organization_id', organizationId)
      .is('ended_at', null)
      .single();

    if (orgPlanError || !orgPlan) {
      logger.warn({ error: orgPlanError, organizationId }, 'Failed to get org plan');
      return null;
    }

    // Get plan limits
    const { data: limits, error: limitsError } = await supabaseServiceClient
      .from('plan_limits')
      .select('metric_key,limit_value,period')
      .eq('plan_id', orgPlan.plan_id);

    if (limitsError) {
      logger.warn({ error: limitsError, planId: orgPlan.plan_id }, 'Failed to get plan limits');
      return null;
    }

    // Build effective plan object with resolved limits
    const plan = {
      id: orgPlan.id,
      plan_id: orgPlan.plan_id,
      name: orgPlan.plans?.name,
      slug: orgPlan.plans?.slug,
      priceMonthly: orgPlan.plans?.price_monthly,
      priceAnnual: orgPlan.plans?.price_annual,
      startedAt: orgPlan.started_at,
      overrideLimits: orgPlan.override_limits || {},
      limits: resolveEffectiveLimits(limits || [], orgPlan.override_limits || {}),
    };

    // Cache result
    planCache.set(organizationId, { data: plan, timestamp: Date.now() });

    return plan;
  } catch (err) {
    logger.error({ error: err, organizationId }, 'Unexpected error in getPlanForOrganization');
    return null;
  }
}

// Resolve effective limit for a metric, checking overrides first
function getEffectiveLimit(metricKey, plan) {
  if (!plan) return -1; // Unlimited if no plan

  // Check for org-level override first
  if (plan.overrideLimits && metricKey in plan.overrideLimits) {
    return plan.overrideLimits[metricKey];
  }

  // Fall back to plan default
  const limitRow = plan.limits.find((l) => l.metric_key === metricKey);
  return limitRow ? limitRow.limit_value : -1; // -1 = unlimited
}

// Helper: Resolve effective limits by checking overrides
function resolveEffectiveLimits(limits, overrides) {
  return limits.map((limit) => ({
    ...limit,
    limit_value: overrides[limit.metric_key] ?? limit.limit_value,
  }));
}

module.exports = {
  getPlanForOrganization,
  getEffectiveLimit,
};

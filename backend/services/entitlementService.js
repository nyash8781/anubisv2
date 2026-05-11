// Entitlement service — checks usage limits and feature access
// Phase C.2 (usage limits), Phase F (feature flags)

const logger = require('../lib/logger');
const { supabaseServiceClient } = require('../db/client');
const planService = require('./planService');
const featureFlagService = require('./featureFlagService');

async function checkUsageLimit(organizationId, metricKey, requestedAmount = 1) {
  if (!supabaseServiceClient || !organizationId) {
    return { allowed: true }; // Fail open in dev
  }

  try {
    // Get effective plan and limits
    const plan = await planService.getPlanForOrganization(organizationId);
    if (!plan) {
      logger.warn({ organizationId, metricKey }, 'No plan found, allowing');
      return { allowed: true };
    }

    // Get effective limit for this metric
    const limit = planService.getEffectiveLimit(metricKey, plan);

    // -1 = unlimited
    if (limit === -1) {
      return { allowed: true };
    }

    // Get current usage for this month
    const currentMonth = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    const { data: usage, error: usageError } = await supabaseServiceClient
      .from('usage_monthly_rollups')
      .select('total_count')
      .eq('organization_id', organizationId)
      .eq('year', year)
      .eq('month', month)
      .eq('metric_key', metricKey)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      // PGRST116 = no rows found (first use of metric this month)
      logger.warn({ error: usageError, metricKey }, 'Failed to get usage');
      return { allowed: true }; // Fail open
    }

    const used = usage?.total_count || 0;
    const wouldUse = used + requestedAmount;

    if (wouldUse > limit) {
      return {
        allowed: false,
        reason: `Your ${plan.name} plan has a ${metricKey.replace(/_/g, ' ')} limit of ${limit} per month. You've used ${used} so far.`,
        used,
        limit,
        planName: plan.name,
        upgradeUrl: `${process.env.FRONTEND_URL}/settings?tab=plan`,
      };
    }

    return {
      allowed: true,
      used,
      limit,
    };
  } catch (err) {
    logger.error({ error: err, organizationId, metricKey }, 'Unexpected error in checkUsageLimit');
    return { allowed: true }; // Fail open on error
  }
}

async function canUseFeature(organizationId, featureKey) {
  if (!supabaseServiceClient || !organizationId || !featureKey) {
    return { allowed: true };
  }

  try {
    // Check if feature is enabled for this organization (Phase F)
    // Returns true if: (1) org override exists and enabled, or (2) global flag enabled, or (3) feature not found (default: enabled)
    const isEnabled = await featureFlagService.isFeatureEnabled(organizationId, featureKey);

    if (!isEnabled) {
      return {
        allowed: false,
        reason: `Feature '${featureKey}' is not enabled for your organization. Contact support to enable this feature.`,
      };
    }

    return { allowed: true };
  } catch (err) {
    logger.error({ error: err, organizationId, featureKey }, 'Unexpected error in canUseFeature');
    // Fail-open: allow feature if lookup fails
    return { allowed: true };
  }
}

module.exports = {
  checkUsageLimit,
  canUseFeature,
};

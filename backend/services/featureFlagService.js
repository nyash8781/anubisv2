const { supabaseServiceClient } = require('../db/client');
const logger = require('../lib/logger');

// Cache for feature flags (5-minute TTL)
const featureFlagCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(organizationId, featureKey) {
  return `${organizationId}:${featureKey}`;
}

async function isFeatureEnabled(organizationId, featureKey) {
  if (!supabaseServiceClient || !organizationId || !featureKey) {
    // Default: allow feature if lookup fails (fail-open)
    return true;
  }

  const cacheKey = getCacheKey(organizationId, featureKey);
  const cached = featureFlagCache.get(cacheKey);

  // Check cache first
  if (cached && Date.now() < cached.expiresAt) {
    return cached.enabled;
  }

  try {
    // Check org-level override first
    const { data: override } = await supabaseServiceClient
      .from('organization_feature_overrides')
      .select('enabled, expires_at')
      .eq('organization_id', organizationId)
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (override) {
      // Check if override has expired
      const isExpired = override.expires_at && new Date(override.expires_at) < new Date();
      if (!isExpired) {
        // Cache the result
        featureFlagCache.set(cacheKey, {
          enabled: override.enabled,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return override.enabled;
      }
    }

    // Fall back to global feature flag
    const { data: globalFlag } = await supabaseServiceClient
      .from('feature_flags')
      .select('enabled')
      .eq('feature_key', featureKey)
      .maybeSingle();

    const enabled = globalFlag?.enabled ?? true; // Default: enabled if not found

    // Cache the result
    featureFlagCache.set(cacheKey, {
      enabled,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return enabled;
  } catch (err) {
    logger.warn({ err, organizationId, featureKey }, 'Feature flag lookup failed');
    // Fail-open: return true if lookup fails
    return true;
  }
}

async function setFeatureFlag(organizationId, featureKey, enabled, reason, expiresAt) {
  if (!supabaseServiceClient || !organizationId || !featureKey) {
    throw new Error('organizationId and featureKey are required');
  }

  try {
    const { data, error } = await supabaseServiceClient
      .from('organization_feature_overrides')
      .upsert(
        {
          organization_id: organizationId,
          feature_key: featureKey,
          enabled,
          reason,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,feature_key' }
      )
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    const cacheKey = getCacheKey(organizationId, featureKey);
    featureFlagCache.delete(cacheKey);

    return data;
  } catch (err) {
    logger.error({ err, organizationId, featureKey }, 'Failed to set feature flag');
    throw err;
  }
}

async function getFeatureOverrides(organizationId) {
  if (!supabaseServiceClient || !organizationId) {
    return [];
  }

  try {
    const { data, error } = await supabaseServiceClient
      .from('organization_feature_overrides')
      .select('*')
      .eq('organization_id', organizationId)
      .order('feature_key', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.warn({ err, organizationId }, 'Failed to get feature overrides');
    return [];
  }
}

// Cleanup expired feature flags (can be run via scheduled task)
async function cleanupExpiredFlags() {
  if (!supabaseServiceClient) return 0;

  try {
    const { data, error } = await supabaseServiceClient
      .from('organization_feature_overrides')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw error;

    const deletedCount = data?.length || 0;
    if (deletedCount > 0) {
      logger.info({ deletedCount }, 'Cleaned up expired feature flags');
    }

    return deletedCount;
  } catch (err) {
    logger.error({ err }, 'Failed to cleanup expired feature flags');
    return 0;
  }
}

module.exports = {
  isFeatureEnabled,
  setFeatureFlag,
  getFeatureOverrides,
  cleanupExpiredFlags,
};

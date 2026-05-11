// Usage event logging service
// Fire-and-forget: never throws, never blocks request handling
// Phase B.6

const logger = require('../lib/logger');
const { supabaseServiceClient } = require('../db/client');

async function log(organizationId, userId, eventType, metadata = {}) {
  // Exit early if missing prerequisites
  if (!supabaseServiceClient || !organizationId) return;

  const eventData = {
    organization_id: organizationId,
    user_id: userId,
    event_type: eventType,
    input_tokens: metadata.input_tokens || null,
    output_tokens: metadata.output_tokens || null,
    count: metadata.count || 1,
    estimated_cost_usd: estimateCost(eventType, metadata),
    resource_type: metadata.resource_type || null,
    resource_id: metadata.resource_id ? String(metadata.resource_id) : null,
    metadata: metadata,
  };

  // Fire and forget — do not await, do not block
  supabaseServiceClient
    .from('usage_events')
    .insert([eventData])
    .then(({ error }) => {
      if (error) {
        logger.warn(
          { error, eventType, organizationId },
          '[usage] Event log failed (non-critical)'
        );
      }
    })
    .catch((err) => {
      logger.warn({ err, eventType }, '[usage] Unexpected error logging event');
    });
}

// Estimate cost based on event type and metadata
// Used for dashboard visibility, not for billing (token counts are ground truth)
function estimateCost(eventType, metadata) {
  if (eventType === 'ai_generation') {
    // Anthropic Haiku pricing (as of 2026-05-10)
    const inputRate = 0.003 / 1000; // $3 per 1M input tokens
    const outputRate = 0.015 / 1000; // $15 per 1M output tokens
    const inputTokens = metadata.input_tokens || 0;
    const outputTokens = metadata.output_tokens || 0;
    return (inputTokens * inputRate) + (outputTokens * outputRate);
  }

  if (eventType === 'sms_sent') {
    // Twilio pricing
    return (metadata.segments || 1) * 0.0079;
  }

  if (eventType === 'email_sent') {
    // Resend pricing
    return 0.0004;
  }

  if (eventType === 'file_uploaded') {
    // Cloudflare R2 storage cost (negligible for small files)
    // Would be computed monthly from cumulative storage
    return 0;
  }

  // Default: no cost
  return 0;
}

module.exports = {
  log,
  estimateCost,
};

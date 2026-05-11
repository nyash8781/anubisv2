const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimiter');
const { generateInsightsSchema, validate } = require('../schemas');
const { supabaseServiceClient } = require('../db/client');
const { generate, generateWithUsage } = require('../ai-provider');
const usageService = require('../services/usageService');
const entitlementService = require('../services/entitlementService');
const logger = require('../lib/logger');

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

router.post(
  '/generate-job-insights',
  requireAuth,
  aiRateLimit,
  validate(generateInsightsSchema),
  async (req, res, next) => {
    try {
      const {
        service = '',
        scope_of_work = '',
        first_name = '',
        last_name = '',
        customer_name = '',
      } = req.body;

      // Get organization ID for usage tracking and limit enforcement (Phase C)
      const organizationId = await getOrganizationIdForUser(req.user.id);

      // Check usage limit before calling AI (Phase C)
      if (organizationId) {
        const limitCheck = await entitlementService.checkUsageLimit(
          organizationId,
          'ai_generations',
          1
        );
        if (!limitCheck.allowed) {
          return res.status(402).json({
            error: 'AI generation limit reached',
            reason: limitCheck.reason,
            used: limitCheck.used,
            limit: limitCheck.limit,
            plan: limitCheck.planName,
            upgradeUrl: limitCheck.upgradeUrl,
          });
        }
      }

      // Fetch system prompt and business context server-side — never trust client-supplied values.
      let base_prompt = '';
      let business_context = '';
      if (supabaseServiceClient) {
        const { data } = await supabaseServiceClient
          .from('user_settings')
          .select('base_prompt, business_context')
          .eq('user_id', req.user.id)
          .maybeSingle();
        if (data) {
          base_prompt = data.base_prompt || '';
          business_context = data.business_context || '';
        }
      }

      const systemPrompt =
        base_prompt || 'You are a professional contractor assistant writing warm, concise follow-up messages.';

      const name =
        [first_name, last_name].filter(Boolean).join(' ') || customer_name || 'the customer';

      const userMessage = [
        business_context ? `Business context: ${business_context}` : '',
        '',
        `Generate two short outputs for the following opportunity, separated by the literal divider "---UPSELL---":`,
        `1. A friendly follow-up message (2-3 sentences) for ${name}.`,
        `2. One specific upsell suggestion relevant to the scope.`,
        '',
        `Service: ${service || 'not specified'}`,
        `Scope: ${scope_of_work || 'not specified'}`,
      ]
        .filter(Boolean)
        .join('\n');

      // Use generateWithUsage to get token counts for usage tracking (Phase C)
      const aiResult = await generateWithUsage(userMessage, systemPrompt);
      const text = aiResult.text;
      const [followUp = '', upsell = ''] = text.split('---UPSELL---').map((s) => s.trim());

      // Log usage event (fire-and-forget, Phase C)
      if (organizationId) {
        usageService.log(organizationId, req.user.id, 'ai_generation', {
          input_tokens: aiResult.inputTokens,
          output_tokens: aiResult.outputTokens,
          model: aiResult.model,
          feature_key: 'job_insights',
        });
      }

      res.json({ followUp, upsell });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimiter');
const { generateInsightsSchema, validate } = require('../schemas');
const { supabaseServiceClient } = require('../db/client');
const aiProvider = require('../ai-provider');

const router = express.Router();

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

      const text = await aiProvider.generate(userMessage, systemPrompt);
      const [followUp = '', upsell = ''] = text.split('---UPSELL---').map((s) => s.trim());

      res.json({ followUp, upsell });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

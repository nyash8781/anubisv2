const { z } = require('zod');

const text = z.string().trim().default('');

// Numeric string — allows digits, optional decimal, rejects letters.
const numericText = z.string().regex(/^\d*\.?\d*$/, 'Must be a number').optional();

const jobUpsertSchema = z.object({
  customer_name: text.optional(),
  first_name: text.optional(),
  last_name: text.optional(),
  email: text.optional(),
  phone: text.optional(),
  mobile_number_1: text.optional(),
  mobile_number_2: text.optional(),
  address: text.optional(),
  address_1: text.optional(),
  city: text.optional(),
  state: text.optional(),
  zip_code: text.optional(),
  service: text.optional(),
  scope_of_work: text.optional(),
  price: numericText,
  bid: numericText,
  payments_received: numericText,
  balance_due: numericText,
  due_date: text.optional(),
  notes: text.optional(),
  milestone: z
    .enum(['Lead', 'Site Visit', 'Proposal', 'Construction', 'Completed'])
    .optional(),
  status: z.enum(['Draft', 'New', 'Contacted', 'Closed']).optional(),
  contact_status: text.optional(),
  last_contacted_date: text.optional(),
  last_contact_method: text.optional(),
  generated_follow_up: text.optional(),
  generated_upsell: text.optional(),
});

const actionSchema = z.object({
  type: z.enum(['call', 'text', 'email', 'manual', 'completed']),
});

// Only the fields the AI endpoint actually uses — no passthrough, no client-supplied prompts.
const generateInsightsSchema = z.object({
  service: text.optional(),
  scope_of_work: text.optional(),
  customer_name: text.optional(),
  first_name: text.optional(),
  last_name: text.optional(),
});

const settingsSchema = z.object({
  base_prompt: z.string().trim().default(''),
  business_context: z.string().trim().default(''),
  extra: z.record(z.unknown()).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  jobUpsertSchema,
  actionSchema,
  generateInsightsSchema,
  settingsSchema,
  validate,
};

/**
 * zod schemas + validate middleware.
 *
 * Every POST/PUT endpoint wraps its handler with validate(schema) so we
 * never accept unvalidated input from the client. Fixes P2-04.
 */

const { z } = require('zod');

// Flexible text field — accepts empty strings.
const text = z.string().trim().default('');

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
  price: z.union([z.string(), z.number()]).optional(),
  bid: z.union([z.string(), z.number()]).optional(),
  payments_received: z.union([z.string(), z.number()]).optional(),
  balance_due: z.union([z.string(), z.number()]).optional(),
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

const generateInsightsSchema = z.object({
  service: text.optional(),
  scope_of_work: text.optional(),
  customer_name: text.optional(),
  first_name: text.optional(),
  last_name: text.optional(),
  system_prompt: text.optional(),
  business_context: text.optional(),
}).passthrough(); // allow the rest of the job payload through — the endpoint only uses a subset

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
  validate,
};

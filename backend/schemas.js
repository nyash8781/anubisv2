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
  milestone: z.string().trim().min(1, 'Milestone cannot be empty').optional(),
  status: z.enum(['Draft', 'New', 'Contacted', 'Closed']).optional(),
  contact_status: text.optional(),
  last_contacted_date: text.optional(),
  last_contact_method: text.optional(),
  generated_follow_up: text.optional(),
  generated_upsell: text.optional(),
  // Production workflow
  production_status: z.enum(['Not Scheduled', 'Ready', 'Scheduled', 'In Progress', 'Blocked', 'Complete']).optional(),
  production_blocker: text.optional(),
  production_owner: text.optional(),
  scheduled_date: text.optional(),
  // Payment status
  payment_status: z.enum(['Not Started', 'Deposit Pending', 'Deposit Paid', 'In Progress', 'Overdue', 'Paid In Full']).optional(),
  deposit_status: z.enum(['N/A', 'Pending', 'Paid']).optional(),
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

// ── Proposals ────────────────────────────────────────────────────────────────

const proposalStatusEnum = z.enum(['draft', 'ready', 'sent', 'approved', 'declined', 'expired']);

const proposalLineItemSchema = z.object({
  id: z.string().uuid().optional(),
  item_name: text.optional(),
  description: text.optional(),
  category: text.optional(),
  room_or_area: text.optional(),
  phase: text.optional(),
  vendor: text.optional(),
  model: text.optional(),
  sku: text.optional(),
  quantity: z.number().nonnegative().default(1),
  unit: text.optional(),
  unit_cost: z.number().nonnegative().default(0),
  markup_type: z.enum(['percent', 'fixed', 'none']).default('none'),
  markup_value: z.number().default(0),
  taxable: z.boolean().default(false),
  optional: z.boolean().default(false),
  included: z.boolean().default(true),
  subtotal: z.number().default(0),
  markup_amount: z.number().default(0),
  total: z.number().default(0),
  source: z.enum(['manual', 'ai_generated', 'catalog', 'document_extract', 'vendor_quote']).default('manual'),
  source_document_id: z.string().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']).default('high'),
  notes: text.optional(),
  internal_notes: text.optional(),
  sort_order: z.number().int().default(0),
});

const proposalSchema = z.object({
  opportunity_id: z.union([z.number().int(), z.null()]).optional(),
  proposal_number: text.optional(),
  title: text.optional(),
  customer_name: text.optional(),
  customer_email: text.optional(),
  expires_at: z.string().datetime().nullable().optional(),
  service_type: text.optional(),
  milestone: text.optional(),
  status: proposalStatusEnum.optional(),
  template_style: z.enum(['modern', 'classic', 'premium']).optional(),
  estimated_start_date: text.optional(),
  due_date: text.optional(),
  scope_of_work: text.optional(),
  included_work: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  client_responsibilities: z.array(z.string()).optional(),
  internal_notes: text.optional(),
  subtotal: z.number().nonnegative().optional(),
  taxable_subtotal: z.number().nonnegative().optional(),
  tax_enabled: z.boolean().optional(),
  tax_rate: z.number().nonnegative().optional(),
  tax_amount: z.number().nonnegative().optional(),
  discount_amount: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  line_items: z.array(proposalLineItemSchema).optional(),
});

const proposalStatusTransitionSchema = z.object({
  status: proposalStatusEnum,
});

const proposalSendSchema = z.object({
  to: z.string().email('Recipient email is invalid'),
  cc: z.string().email().optional().or(z.literal('')),
  subject: text.optional(),
  message: text.optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

// ── Payments ─────────────────────────────────────────────────────────────────

const paymentRequestSchema = z.object({
  opportunity_id: z.number().int().positive(),
  proposal_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().length(3).optional().default('usd'),
  description: text.optional(),
});

const paymentManualMarkSchema = z.object({
  status: z.enum(['succeeded', 'failed', 'refunded', 'manual']),
  paid_at: z.string().datetime().optional(),
  notes: text.optional(),
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
  proposalSchema,
  proposalLineItemSchema,
  proposalStatusTransitionSchema,
  proposalSendSchema,
  paymentRequestSchema,
  paymentManualMarkSchema,
  validate,
};

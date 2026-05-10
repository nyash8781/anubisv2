const { env } = require('../config/env');

// Use Supabase when service role key is present; fall back to JSON flat-file otherwise.
const useSupabase = !!(env.supabaseUrl && env.supabaseServiceRoleKey);

const jsonStore = require('./jsonStore');
const supabaseStore = useSupabase ? require('./supabaseStore') : null;

const logger = require('../lib/logger');

if (useSupabase) {
  logger.info('[db] Using Supabase data store');
} else {
  logger.info('[db] Using JSON flat-file store (set SUPABASE_SERVICE_ROLE_KEY to enable Supabase)');
}

function getDb(userId) {
  if (useSupabase && supabaseStore) {
    return supabaseStore.forUser(userId);
  }
  return jsonStore.forUser(userId);
}

// Admin handlers — used by webhooks where there is no JWT context.
// The Stripe webhook signature must be verified upstream before any of these
// helpers are called.
function getAdminDb() {
  const store = useSupabase && supabaseStore ? supabaseStore : jsonStore;
  return {
    findPaymentByStripeRef: store.findPaymentByStripeRefAdmin,
    updatePayment: store.adminUpdatePayment,
    decrementOpportunityBalance: store.adminDecrementOpportunityBalance,
    logActivity: store.adminLogActivity,
  };
}

module.exports = { getDb, getAdminDb, useSupabase };

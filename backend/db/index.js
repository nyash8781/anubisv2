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

module.exports = { getDb, useSupabase };

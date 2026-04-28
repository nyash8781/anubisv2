const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');

const supabaseServiceClient =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

module.exports = { supabaseServiceClient };

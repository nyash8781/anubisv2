const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');
const logger = require('../lib/logger');

const _supabaseClient =
  env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey)
    : null;

if (!_supabaseClient) {
  logger.warn('Supabase not configured — requireAuth will use dev bypass (dev mode only)');
}

async function requireAuth(req, res, next) {
  if (!_supabaseClient) {
    req.user = { id: 'dev-user-no-supabase' };
    return next();
  }

  const header = req.headers['authorization'] || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error } = await _supabaseClient.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  req.user = user;
  next();
}

module.exports = { requireAuth };

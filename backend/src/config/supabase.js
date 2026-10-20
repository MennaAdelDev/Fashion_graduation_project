const { createClient } = require('@supabase/supabase-js');
const env = require('./env');
const AppError = require('../utils/AppError');

let adminClient;

function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Supabase is not configured on the server');
  }
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return adminClient;
}

module.exports = { getSupabaseAdmin };

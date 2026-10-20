const { Router } = require('express');
const { getSupabaseAdmin } = require('../config/supabase');
const AppError = require('../utils/AppError');
const { sendData } = require('../utils/response');

const router = Router();

router.get('/', (req, res) => {
  sendData(res, { status: 'ok', time: new Date().toISOString() });
});

router.get('/db', async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase.from('categories').select('id', { count: 'exact', head: true });
  if (error) {
    console.error('Database health check failed:', error.message);
    throw new AppError(500, 'INTERNAL_ERROR', 'Database health check failed');
  }
  sendData(res, { database: 'ok', categories_count: count });
});

module.exports = router;

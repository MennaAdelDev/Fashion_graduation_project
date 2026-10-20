const { Router } = require('express');

const router = Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/materials', require('./materials.routes'));
router.use('/providers', require('./providers.routes'));
router.use('/projects', require('./projects.routes'));
router.use('/project-requests', require('./projectRequests.routes'));
router.use('/quotes', require('./quotes.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/order-issues', require('./orderIssues.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/conversations', require('./conversations.routes'));
router.use('/ai', require('./ai.routes'));

module.exports = router;

const { Router } = require('express');
const notImplemented = require('../middleware/notImplemented');

const router = Router();

router.get('/', notImplemented('Sprint 2'));

module.exports = router;

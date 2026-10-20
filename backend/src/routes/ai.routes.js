const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.post('/extract-requirements', validate({ body: schemas.aiExtract }), notImplemented('Sprint 3'));
router.post('/generate-design', validate({ body: schemas.aiGenerateDesign }), notImplemented('Sprint 3'));

module.exports = router;

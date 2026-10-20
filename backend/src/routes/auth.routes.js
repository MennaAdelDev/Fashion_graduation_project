const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.post('/register', validate({ body: schemas.register }), notImplemented('Sprint 2'));
router.post('/login', validate({ body: schemas.login }), notImplemented('Sprint 2'));
router.get('/me', notImplemented('Sprint 2'));

module.exports = router;

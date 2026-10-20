const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.patch('/:id', validate({ params: schemas.idParams, body: schemas.issueResolve }), notImplemented('Sprint 9'));

module.exports = router;

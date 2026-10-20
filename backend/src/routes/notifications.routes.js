const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.get('/', validate({ query: schemas.notificationListQuery }), notImplemented('Sprint 4'));
router.patch('/:id/read', validate({ params: schemas.idParams }), notImplemented('Sprint 4'));

module.exports = router;

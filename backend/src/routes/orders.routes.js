const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.get('/', validate({ query: schemas.orderListQuery }), notImplemented('Sprint 9'));
router.get('/:id', validate({ params: schemas.idParams }), notImplemented('Sprint 9'));
router.patch('/:id', validate({ params: schemas.idParams, body: schemas.orderDeliveryUpdate }), notImplemented('Sprint 9'));
router.patch('/:id/status', validate({ params: schemas.idParams, body: schemas.orderStatusUpdate }), notImplemented('Sprint 9'));

router.get('/:id/stages', validate({ params: schemas.idParams }), notImplemented('Sprint 9'));
router.patch('/:id/stages/:stage_id', validate({ params: schemas.stageParams, body: schemas.stageUpdate }), notImplemented('Sprint 9'));

router.get('/:id/payments', validate({ params: schemas.idParams }), notImplemented('Sprint 9'));
router.post('/:id/payments', validate({ params: schemas.idParams, body: schemas.paymentCreate }), notImplemented('Sprint 9'));

router.get('/:id/issues', validate({ params: schemas.idParams }), notImplemented('Sprint 9'));
router.post('/:id/issues', validate({ params: schemas.idParams, body: schemas.issueCreate }), notImplemented('Sprint 9'));

router.post('/:id/media', validate({ params: schemas.idParams }), notImplemented('Sprint 9'));

module.exports = router;

const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.get('/', validate({ query: schemas.projectRequestListQuery }), notImplemented('Sprint 3'));
router.get('/:id', validate({ params: schemas.idParams }), notImplemented('Sprint 3'));
router.patch(
  '/:id',
  validate({ params: schemas.idParams, body: schemas.projectRequestStatusUpdate }),
  notImplemented('Sprint 4')
);
router.get('/:id/quotes', validate({ params: schemas.idParams }), notImplemented('Sprint 9'));
router.post(
  '/:id/quotes',
  validate({ params: schemas.idParams, body: schemas.quoteCreate }),
  notImplemented('Sprint 9')
);

module.exports = router;

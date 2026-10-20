const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.get('/', validate({ query: schemas.projectListQuery }), notImplemented('Sprint 3'));
router.post('/', validate({ body: schemas.projectCreate }), notImplemented('Sprint 3'));
router.get('/:id', validate({ params: schemas.idParams }), notImplemented('Sprint 3'));
router.patch('/:id', validate({ params: schemas.idParams, body: schemas.projectUpdate }), notImplemented('Sprint 3'));
router.patch(
  '/:id/status',
  validate({ params: schemas.idParams, body: schemas.projectStatusUpdate }),
  notImplemented('Sprint 3')
);
router.put('/:id/items', validate({ params: schemas.idParams, body: schemas.projectItemsReplace }), notImplemented('Sprint 3'));
router.get('/:id/designs', validate({ params: schemas.idParams }), notImplemented('Sprint 3'));
router.post('/:id/designs', validate({ params: schemas.idParams }), notImplemented('Sprint 3'));
router.post('/:id/matches', validate({ params: schemas.idParams }), notImplemented('Sprint 4'));
router.get('/:id/matches', validate({ params: schemas.idParams }), notImplemented('Sprint 4'));
router.post(
  '/:id/requests',
  validate({ params: schemas.idParams, body: schemas.projectRequestCreate }),
  notImplemented('Sprint 3')
);

module.exports = router;

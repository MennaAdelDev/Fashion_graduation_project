const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

const portfolioParams = z.object({ portfolio_id: z.string().uuid() });

router.get('/', validate({ query: schemas.providerListQuery }), notImplemented('Sprint 2'));
router.get('/compare', validate({ query: schemas.providerCompareQuery }), notImplemented('Sprint 4'));

router.get('/me', notImplemented('Sprint 2'));
router.patch('/me', validate({ body: schemas.providerUpdate }), notImplemented('Sprint 2'));
router.put(
  '/me/pricing/:category_id',
  validate({ params: schemas.pricingParams, body: schemas.pricingUpsert }),
  notImplemented('Sprint 2')
);
router.delete('/me/pricing/:category_id', validate({ params: schemas.pricingParams }), notImplemented('Sprint 2'));
router.put('/me/materials', validate({ body: schemas.providerMaterialsReplace }), notImplemented('Sprint 2'));
router.put('/me/working-hours', validate({ body: schemas.workingHoursReplace }), notImplemented('Sprint 2'));
router.put('/me/availability', validate({ body: schemas.availabilityReplace }), notImplemented('Sprint 2'));
router.post('/me/portfolio', notImplemented('Sprint 2'));
router.delete('/me/portfolio/:portfolio_id', validate({ params: portfolioParams }), notImplemented('Sprint 2'));

router.get('/:id', validate({ params: schemas.idParams }), notImplemented('Sprint 2'));
router.get(
  '/:id/availability',
  validate({ params: schemas.idParams, query: schemas.availabilityQuery }),
  notImplemented('Sprint 2')
);
router.get(
  '/:id/reviews',
  validate({ params: schemas.idParams, query: z.object({ ...schemas.pagination }) }),
  notImplemented('Sprint 3')
);
router.post(
  '/:id/reviews',
  validate({ params: schemas.idParams, body: schemas.reviewCreate }),
  notImplemented('Sprint 3')
);

module.exports = router;

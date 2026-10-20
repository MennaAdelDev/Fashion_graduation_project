const { Router } = require('express');
const validate = require('../middleware/validate');
const notImplemented = require('../middleware/notImplemented');
const schemas = require('../validators/schemas');

const router = Router();

router.get('/', notImplemented('Sprint 4'));
router.post('/', validate({ body: schemas.conversationCreate }), notImplemented('Sprint 4'));
router.get(
  '/:id/messages',
  validate({ params: schemas.idParams, query: schemas.messageListQuery }),
  notImplemented('Sprint 4')
);
router.post(
  '/:id/messages',
  validate({ params: schemas.idParams, body: schemas.messageCreate }),
  notImplemented('Sprint 4')
);

module.exports = router;

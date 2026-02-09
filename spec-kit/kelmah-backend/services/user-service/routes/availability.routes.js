const router = require('express').Router();
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');
const controller = require('../controllers/availability.controller');

router.use(verifyGatewayRequest);

router.get('/:userId?', controller.getAvailability);
router.put('/:userId?', controller.upsertAvailability);
router.delete('/:userId/holidays/:date', controller.deleteHoliday);

module.exports = router;



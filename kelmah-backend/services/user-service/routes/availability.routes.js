const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const controller = require('../controllers/availability.controller');

router.use(authenticate);

router.get('/:userId?', controller.getAvailability);
router.put('/:userId?', controller.upsertAvailability);
router.delete('/:userId/holidays/:date', controller.deleteHoliday);

module.exports = router;



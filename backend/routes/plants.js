const express = require('express');
const {
  getPlants,
  getPlant,
  createPlant,
  updatePlant,
  deletePlant,
  getPlantsByStatus,
  applyPlantAction
} = require('../controllers/plantController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getPlants)
  .post(createPlant);

router.route('/status/:status')
  .get(getPlantsByStatus);

router.route('/:id')
  .get(getPlant)
  .put(updatePlant)
  .delete(deletePlant);

router.route('/:id/action')
  .put(applyPlantAction);

module.exports = router;


const express = require('express');
const {
  getDiseases,
  getDisease,
  getDiseaseByName,
  getTreatment,
  createDisease,
  updateDisease,
  deleteDisease
} = require('../controllers/diseaseController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/', getDiseases);
router.get('/name/:name', getDiseaseByName);
router.get('/:name/treatment', getTreatment);
router.get('/:id', getDisease);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .post(createDisease);

router.route('/:id')
  .put(updateDisease)
  .delete(deleteDisease);

module.exports = router;


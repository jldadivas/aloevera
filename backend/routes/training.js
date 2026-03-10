const express = require('express');
const {
  getTrainingDataset,
  getPendingValidations,
  validateEntry,
  rejectEntry,
  exportBatch,
  autoFlagLowConfidence,
  getStats
} = require('../controllers/trainingController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/', getTrainingDataset);
router.get('/pending', getPendingValidations);
router.get('/stats', getStats);
router.post('/export', exportBatch);
router.post('/auto-flag', autoFlagLowConfidence);
router.put('/:id/validate', validateEntry);
router.put('/:id/reject', rejectEntry);

module.exports = router;


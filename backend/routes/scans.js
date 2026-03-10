const express = require('express');
const {
  createScan,
  getScans,
  getScan,
  updateScan,
  deleteScan,
  getScansByPlant
} = require('../controllers/scanController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { scanLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getScans)
  .post(scanLimiter, upload.single('image'), createScan);

router.route('/plant/:plantId')
  .get(getScansByPlant);

router.route('/:id')
  .get(getScan)
  .put(updateScan)
  .delete(deleteScan);

module.exports = router;


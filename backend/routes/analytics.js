const express = require('express');
const {
  getAnalytics,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getUserAnalytics,
  getSummary
} = require('../controllers/analyticsController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getAnalytics);
router.get('/user', getUserAnalytics);
router.get('/daily', getDailyAnalytics);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/summary', getSummary);

module.exports = router;


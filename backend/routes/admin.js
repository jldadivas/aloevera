const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createAdmin,
  getAllScans,
  exportScanImagesZip,
  flagScan,
  deleteAnyScan,
  getAllPlants,
  getAdminAnalytics,
  getCommunityPosts,
  moderateCommunityPost,
  moderateCommunityComment,
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  getCommunityReports,
  resolveCommunityReport,
  muteCommunityUser,
  getCommunityModerationAnalytics
} = require('../controllers/adminController');

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/create-admin', createAdmin);

router.get('/scans', getAllScans);
router.get('/scans/images/zip', exportScanImagesZip);
router.put('/scans/:id/flag', flagScan);
router.delete('/scans/:id', deleteAnyScan);

router.get('/plants', getAllPlants);

router.get('/analytics', getAdminAnalytics);
router.get('/tickets', getSupportTickets);
router.post('/tickets', createSupportTicket);
router.put('/tickets/:id', updateSupportTicket);

router.get('/community/posts', getCommunityPosts);
router.put('/community/posts/:id/moderate', moderateCommunityPost);
router.put('/community/posts/:postId/comments/:commentId/moderate', moderateCommunityComment);
router.get('/community/reports', getCommunityReports);
router.put('/community/reports/:id/resolve', resolveCommunityReport);
router.put('/community/users/:id/mute', muteCommunityUser);
router.get('/community/analytics', getCommunityModerationAnalytics);

module.exports = router;

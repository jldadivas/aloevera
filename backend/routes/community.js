const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  reportPost,
  reportComment,
  getChatUsers,
  getChatConversations,
  getDirectMessages,
  sendDirectMessage
} = require('../controllers/communityController');
const { communityPostLimiter, communityCommentLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/posts', getPosts);
router.post('/posts', communityPostLimiter, createPost);
router.post('/posts/:id/like', communityCommentLimiter, toggleLike);
router.post('/posts/:id/comments', communityCommentLimiter, addComment);
router.post('/posts/:id/report', communityCommentLimiter, reportPost);
router.post('/posts/:id/comments/:commentId/report', communityCommentLimiter, reportComment);
router.get('/chat/users', authorize('grower'), getChatUsers);
router.get('/chat/conversations', authorize('grower'), getChatConversations);
router.get('/chat/messages/:userId', authorize('grower'), getDirectMessages);
router.post('/chat/messages', authorize('grower'), communityCommentLimiter, sendDirectMessage);

module.exports = router;

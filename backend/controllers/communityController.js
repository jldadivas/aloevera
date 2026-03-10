const CommunityPost = require('../models/communityPost');
const CommunityMessage = require('../models/communityMessage');
const Scan = require('../models/scan');
const User = require('../models/user');
const CommunityReport = require('../models/communityReport');
const asyncHandler = require('../utils/controllerWrapper');
const mongoose = require('mongoose');

const PROFANITY_KEYWORDS = ['putang', 'bobo', 'gago', 'ulol', 'tanga', 'shit', 'fuck'];

const hasProfanity = (text = '') => {
  const lower = text.toLowerCase();
  return PROFANITY_KEYWORDS.some((word) => lower.includes(word));
};

const ensureCommunityNotMuted = async (userId) => {
  const user = await User.findById(userId).select('community_mute_until');
  if (user?.community_mute_until && new Date(user.community_mute_until) > new Date()) {
    const until = new Date(user.community_mute_until).toISOString();
    const err = new Error(`You are temporarily muted from community actions until ${until}`);
    err.statusCode = 403;
    throw err;
  }
};

// @desc    Get community feed posts
// @route   GET /api/v1/community/posts
// @access  Private
exports.getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const posts = await CommunityPost.find({ is_hidden: false })
    .populate('user_id', 'full_name email profile_picture')
    .populate('comments.user_id', 'full_name profile_picture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await CommunityPost.countDocuments();

  const data = posts.map((post) => {
    const postObj = post.toObject();
    const visibleComments = (postObj.comments || []).filter((comment) => !comment.is_hidden);
    return {
      ...postObj,
      comments: visibleComments,
      likes_count: post.likes.length,
      comments_count: visibleComments.length,
      liked_by_me: post.likes.some((id) => id.toString() === req.user.id)
    };
  });

  res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data
  });
});

// @desc    Create community post from user's scan
// @route   POST /api/v1/community/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res) => {
  const { scan_id, caption = '' } = req.body;

  await ensureCommunityNotMuted(req.user.id);

  if (!scan_id) {
    return res.status(400).json({
      success: false,
      error: 'scan_id is required'
    });
  }

  if (hasProfanity(caption)) {
    return res.status(400).json({
      success: false,
      error: 'Caption contains blocked/profane words'
    });
  }

  const scan = await Scan.findOne({ _id: scan_id, user_id: req.user.id });
  if (!scan) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found'
    });
  }

  const imageUrl = scan.image_data?.thumbnail_url || scan.image_data?.original_url;
  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      error: 'Selected scan has no image'
    });
  }

  // Simple anti-spam: prevent duplicate posts from same scan within 10 minutes
  const duplicateRecentPost = await CommunityPost.findOne({
    user_id: req.user.id,
    scan_id: scan_id,
    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
  });

  if (duplicateRecentPost) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate post detected. Please wait before posting the same scan again.'
    });
  }

  const post = await CommunityPost.create({
    user_id: req.user.id,
    scan_id: scan._id,
    image_url: imageUrl,
    caption,
    disease_name: scan.analysis_result?.disease_name || (scan.analysis_result?.disease_detected ? 'diseased' : 'healthy')
  });

  const populated = await CommunityPost.findById(post._id)
    .populate('user_id', 'full_name email profile_picture')
    .populate('comments.user_id', 'full_name profile_picture');

  res.status(201).json({
    success: true,
    data: {
      ...populated.toObject(),
      likes_count: 0,
      comments_count: 0,
      liked_by_me: false
    }
  });
});

// @desc    Toggle like on post
// @route   POST /api/v1/community/posts/:id/like
// @access  Private
exports.toggleLike = asyncHandler(async (req, res) => {
  await ensureCommunityNotMuted(req.user.id);

  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  const userId = req.user.id.toString();
  const existingIndex = post.likes.findIndex((id) => id.toString() === userId);

  if (existingIndex >= 0) {
    post.likes.splice(existingIndex, 1);
  } else {
    post.likes.push(req.user.id);
  }

  await post.save();

  res.status(200).json({
    success: true,
    data: {
      liked_by_me: existingIndex < 0,
      likes_count: post.likes.length
    }
  });
});

// @desc    Add comment to post
// @route   POST /api/v1/community/posts/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  await ensureCommunityNotMuted(req.user.id);

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Comment text is required'
    });
  }

  if (hasProfanity(text)) {
    return res.status(400).json({
      success: false,
      error: 'Comment contains blocked/profane words'
    });
  }

  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  const trimmed = text.trim();

  // Simple anti-spam: duplicate comment text by same user on same post within 3 minutes
  const duplicate = post.comments.find(
    (c) =>
      c.user_id?.toString() === req.user.id.toString() &&
      c.text?.toLowerCase() === trimmed.toLowerCase() &&
      new Date(c.createdAt).getTime() > Date.now() - 3 * 60 * 1000
  );

  if (duplicate) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate comment detected. Please wait before repeating the same comment.'
    });
  }

  post.comments.push({
    user_id: req.user.id,
    text: trimmed
  });

  await post.save();
  await post.populate('comments.user_id', 'full_name profile_picture');

  const lastComment = post.comments[post.comments.length - 1];

  res.status(201).json({
    success: true,
    data: {
      comment: lastComment,
      comments_count: post.comments.length
    }
  });
});

// @desc    Report a community post
// @route   POST /api/v1/community/posts/:id/report
// @access  Private
exports.reportPost = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Report reason is required'
    });
  }

  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  const report = await CommunityReport.create({
    reporter_id: req.user.id,
    target_type: 'post',
    post_id: post._id,
    target_user_id: post.user_id,
    reason: reason.trim()
  });

  post.flagged_for_review = true;
  await post.save();

  res.status(201).json({
    success: true,
    data: report,
    message: 'Post reported successfully'
  });
});

// @desc    Report a comment
// @route   POST /api/v1/community/posts/:id/comments/:commentId/report
// @access  Private
exports.reportComment = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Report reason is required'
    });
  }

  const post = await CommunityPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({
      success: false,
      error: 'Comment not found'
    });
  }

  const report = await CommunityReport.create({
    reporter_id: req.user.id,
    target_type: 'comment',
    post_id: post._id,
    comment_id: comment._id,
    target_user_id: comment.user_id,
    reason: reason.trim()
  });

  comment.flagged_for_review = true;
  post.flagged_for_review = true;
  await post.save();

  res.status(201).json({
    success: true,
    data: report,
    message: 'Comment reported successfully'
  });
});

// @desc    List users available for community chat
// @route   GET /api/v1/community/chat/users
// @access  Private
exports.getChatUsers = asyncHandler(async (req, res) => {
  const { search = '', limit = 50 } = req.query;
  const query = {
    _id: { $ne: req.user.id },
    is_active: true,
    role: 'grower'
  };

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ full_name: regex }, { email: regex }];
  }

  const users = await User.find(query)
    .select('full_name email profile_picture role')
    .sort({ full_name: 1 })
    .limit(parseInt(limit, 10));

  res.status(200).json({
    success: true,
    data: users
  });
});

// @desc    Get message conversations grouped by peer user
// @route   GET /api/v1/community/chat/conversations
// @access  Private
exports.getChatConversations = asyncHandler(async (req, res) => {
  const me = new mongoose.Types.ObjectId(req.user.id);
  const messages = await CommunityMessage.find({
    $or: [{ sender_id: me }, { recipient_id: me }]
  })
    .sort({ createdAt: -1 })
    .populate('sender_id', 'full_name email profile_picture role')
    .populate('recipient_id', 'full_name email profile_picture role')
    .limit(400);

  const byPeer = new Map();
  for (const msg of messages) {
    const senderId = msg.sender_id?._id?.toString();
    const recipientId = msg.recipient_id?._id?.toString();
    const peer = senderId === req.user.id ? msg.recipient_id : msg.sender_id;
    if (!peer?._id) continue;
    if (String(peer.role).toLowerCase() === 'admin') continue;
    const peerId = peer._id.toString();
    if (!byPeer.has(peerId)) {
      byPeer.set(peerId, {
        peer_user: peer,
        last_message: msg.text,
        last_message_at: msg.createdAt,
        unread_count: 0
      });
    }
    if (recipientId === req.user.id && !msg.is_read) {
      const row = byPeer.get(peerId);
      row.unread_count += 1;
    }
  }

  res.status(200).json({
    success: true,
    data: Array.from(byPeer.values())
  });
});

// @desc    Get direct messages with one user
// @route   GET /api/v1/community/chat/messages/:userId
// @access  Private
exports.getDirectMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 120 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, error: 'Invalid user id' });
  }

  const peer = await User.findById(userId).select('_id role');
  if (!peer) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  if (String(peer.role).toLowerCase() === 'admin') {
    return res.status(403).json({ success: false, error: 'Messaging admins is not allowed' });
  }

  const messages = await CommunityMessage.find({
    $or: [
      { sender_id: req.user.id, recipient_id: userId },
      { sender_id: userId, recipient_id: req.user.id }
    ]
  })
    .sort({ createdAt: 1 })
    .limit(parseInt(limit, 10))
    .populate('sender_id', 'full_name email profile_picture')
    .populate('recipient_id', 'full_name email profile_picture');

  await CommunityMessage.updateMany(
    { sender_id: userId, recipient_id: req.user.id, is_read: false },
    { $set: { is_read: true } }
  );

  res.status(200).json({
    success: true,
    data: messages
  });
});

// @desc    Send direct message to a user
// @route   POST /api/v1/community/chat/messages
// @access  Private
exports.sendDirectMessage = asyncHandler(async (req, res) => {
  const { recipient_id, text } = req.body;
  const trimmed = (text || '').trim();

  if (!recipient_id || !mongoose.Types.ObjectId.isValid(recipient_id)) {
    return res.status(400).json({ success: false, error: 'Valid recipient_id is required' });
  }
  if (!trimmed) {
    return res.status(400).json({ success: false, error: 'Message text is required' });
  }
  if (recipient_id === req.user.id.toString()) {
    return res.status(400).json({ success: false, error: 'You cannot message yourself' });
  }
  if (hasProfanity(trimmed)) {
    return res.status(400).json({ success: false, error: 'Message contains blocked/profane words' });
  }

  const recipient = await User.findOne({ _id: recipient_id, is_active: true, role: 'grower' }).select('_id');
  if (!recipient) {
    return res.status(404).json({ success: false, error: 'Recipient not found' });
  }

  const msg = await CommunityMessage.create({
    sender_id: req.user.id,
    recipient_id,
    text: trimmed
  });

  const populated = await CommunityMessage.findById(msg._id)
    .populate('sender_id', 'full_name email profile_picture')
    .populate('recipient_id', 'full_name email profile_picture');

  res.status(201).json({
    success: true,
    data: populated
  });
});

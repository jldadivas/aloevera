const SupportTicket = require('../models/supportTicket');
const asyncHandler = require('../utils/controllerWrapper');
const { uploadImage } = require('../services/imageService');

const allowedCategories = new Set(['technical', 'account', 'billing', 'feature_request', 'bug_report', 'other']);
const allowedPriorities = new Set(['low', 'medium', 'high', 'urgent']);

const normalizeText = (value = '') => String(value).trim();

// @desc    Submit support ticket (manual)
// @route   POST /api/v1/tickets
// @access  Private
exports.createTicket = asyncHandler(async (req, res) => {
  const fullNameInput = normalizeText(req.body.full_name);
  const emailInput = normalizeText(req.body.email).toLowerCase();
  const deviceModel = normalizeText(req.body.device_model || req.body.mobile_unit);
  const osVersion = normalizeText(req.body.os_version);
  const categoryInput = normalizeText(req.body.issue_category || req.body.category || 'other').toLowerCase();
  const description = normalizeText(req.body.description);
  const subjectInput = normalizeText(req.body.subject);
  const priorityInput = normalizeText(req.body.priority || 'medium').toLowerCase();

  const reporter_name = fullNameInput || req.user.full_name || 'Unknown User';
  const reporter_email = emailInput || req.user.email;

  if (!reporter_name || !reporter_email || !deviceModel || !osVersion || !description) {
    return res.status(400).json({
      success: false,
      error: 'full_name, email, device_model, os_version, and description are required'
    });
  }

  if (!allowedCategories.has(categoryInput)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid issue category'
    });
  }

  if (!allowedPriorities.has(priorityInput)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid priority'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Issue image is required'
    });
  }

  const upload = await uploadImage(req.file.buffer, 'aloe-vera-tickets');

  const ticket = await SupportTicket.create({
    user_id: req.user.id,
    reporter_name,
    reporter_email,
    device_model: deviceModel,
    os_version: osVersion,
    category: categoryInput,
    priority: priorityInput,
    subject: subjectInput || `${categoryInput.replace(/_/g, ' ')} issue`,
    description,
    issue_image: {
      url: upload.secure_url,
      public_id: upload.public_id
    },
    status: 'open',
    timeline: [{
      action: 'ticket_created',
      note: 'Ticket submitted by user',
      by_admin: null
    }]
  });

  res.status(201).json({
    success: true,
    ticket_number: ticket.ticket_number,
    status: 'Open',
    data: {
      id: ticket._id,
      ticket_number: ticket.ticket_number,
      status: ticket.status
    }
  });
});

// @desc    Get current user's tickets
// @route   GET /api/v1/tickets/me
// @access  Private
exports.getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user_id: req.user.id })
    .sort({ createdAt: -1 })
    .select('ticket_number subject category priority status createdAt resolved_at closed_at');

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

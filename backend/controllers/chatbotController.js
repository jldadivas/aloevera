const chatbotService = require('../services/chatbotService');
const controllerWrapper = require('../utils/controllerWrapper');

// @desc    Chat with Aloe Vera chatbot
// @route   POST /api/v1/chatbot/ask
// @access  Public
exports.ask = controllerWrapper(async (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Please provide a message'
    });
  }

  try {
    const response = await chatbotService.chat(message);
    
    res.status(200).json({
      success: true,
      data: {
        message: message,
        response: response
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process your question'
    });
  }
});

// @desc    Get chatbot info
// @route   GET /api/v1/chatbot/info
// @access  Public
exports.info = controllerWrapper(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Aloe Vera Assistant',
      description: 'Your personal guide to all things Aloe Vera',
      capabilities: [
        'Answer questions about Aloe Vera care and growing',
        'Provide health and wellness information',
        'Suggest practical tips and remedies',
        'Discuss traditional and modern uses'
      ]
    }
  });
});

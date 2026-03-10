/**
 * ML Integration Routes
 * Routes for disease detection, age estimation, and recommendations
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/controllerWrapper');
const mlService = require('../services/mlIntegrationService');

/**
 * @route   GET /api/v1/ml/health
 * @desc    Check ML service health
 * @access  Public
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const health = await mlService.healthCheck();
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v1/ml/info
 * @desc    Get ML service information
 * @access  Public
 */
router.get('/info', asyncHandler(async (req, res) => {
  try {
    const info = await mlService.getServiceInfo();
    res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v1/ml/detect-disease
 * @desc    Detect disease in plant image
 * @access  Private
 * @body    file (image)
 */
router.post('/detect-disease', protect, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload an image'
    });
  }

  try {
    const live = String(req.query.live || '').toLowerCase() === 'true';
    const result = await mlService.detectDisease(
      req.file.buffer,
      req.file.originalname,
      { live }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v1/ml/estimate-age
 * @desc    Estimate plant age from image
 * @access  Private
 * @body    file (image)
 */
router.post('/estimate-age', protect, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload an image'
    });
  }

  try {
    const result = await mlService.estimateAge(
      req.file.buffer,
      req.file.originalname
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v1/ml/full-scan
 * @desc    Complete plant scan (disease + age)
 * @access  Private
 * @body    file (image)
 */
router.post('/full-scan', protect, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload an image'
    });
  }

  try {
    const result = await mlService.scanPlant(
      req.file.buffer,
      req.file.originalname
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v1/ml/recommendations/:disease
 * @desc    Get treatment recommendations for a disease
 * @access  Private
 * @param   {String} disease - Disease name
 */
router.get('/recommendations/:disease', protect, asyncHandler(async (req, res) => {
  try {
    const recommendations = await mlService.getRecommendations(req.params.disease);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v1/ml/disease-classes
 * @desc    Get available disease classes
 * @access  Public
 */
router.get('/disease-classes', (req, res) => {
  const diseaseClasses = {
    0: "healthy",
    1: "leaf_spot",
    2: "rust",
    3: "fungal_disease",
    4: "bacterial_soft_rot"
  };

  res.status(200).json({
    success: true,
    data: {
      total_classes: Object.keys(diseaseClasses).length,
      classes: diseaseClasses,
      description: "Disease classes detected by YOLOv8 model"
    }
  });
});

module.exports = router;
